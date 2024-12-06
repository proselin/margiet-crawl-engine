import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { nanoid } from 'nanoid';
import { Page } from 'puppeteer';
import { InjectMinio } from '@margiet-libs/minio';
import { EnvName } from '@/common/constant/env';
import { JobUtils } from '@/utils/job-utils';
import {
  RawImage,
  CrawlUploadResponse, ResultHandleImageUrls$V1,
  ResultHandleImageUrls$V2,
  UploadMinioResponse,
} from '@/common';
import { exec } from 'node:child_process';

@Injectable()
export class CrawlUploadService {
  private logger = new Logger(CrawlUploadService.name);

  constructor(
    private configService: ConfigService,
    @InjectMinio() private readonly minioClient: MinioClient,
  ) {
    console.log(configService.get(EnvName.MINIO_BUCKET));
  }

  async crawlAndUploadImageToStore(
    page: Page,
    prefixFileName: string,
    svUrls: string[],
  ) {
    const responseSvData = await this.handleImageUrls(page, svUrls);
    const contentType = responseSvData.headers?.['content-type'];
    const fileName = await this.generateFileName(prefixFileName, contentType);
    const minioBucket = this.configService.get(EnvName.MINIO_BUCKET)
    return this.uploadToMinio(
      responseSvData.buffer,
      contentType,
      fileName,
      minioBucket,
    );
  }

  async crawlAndUploadMulti(
    prefixFileName: string,
    data: RawImage[],
  ): Promise<CrawlUploadResponse> {
    const minioBucket: string = this.configService.get(EnvName.MINIO_BUCKET)
    // page.off('request');
    return Promise.all(
      data.map(async (item) => {
        try {
          // const { buffer, headers } = await this.handleImageUrls(
          //   page,
          //   item.imageUrls,
          // );
          // const contentType = headers?.['content-type'];

          const {buffer, contentType} = await this.handleImageUrlsV2(item.imageUrls);
          const fileName = await this.generateFileName(
            prefixFileName,
            contentType,
          );

          const uploadResponse = await this.uploadToMinio(
            buffer,
            contentType,
            fileName,
            minioBucket,
          );
          return {
            ...uploadResponse,
            position: item.position,
            originUrls: item.imageUrls,
          };
        } catch (e) {
          this.logger.error(
            `[${this.crawlAndUploadMulti.name}]:= Error with data`,
            { rawCrawlData: item, error: e },
          );
          return {
            fileUrl: null,
            fileName: null,
            bucketName: null,
            position: item.position,
            originUrls: item.imageUrls,
          };
        }
      }),
    );
  }

  async uploadToMinio(
    file: Buffer,
    contentType: string,
    fileName: string,
    bucketName: string,
  ): Promise<UploadMinioResponse> {
    await this.checkBucketIsExist(bucketName);
    // await this.setBucketPolicyPublic(bucketName)
    await this.minioClient.putObject(bucketName, fileName, file, undefined, {
      'Content-Type': contentType,
    });
    this.logger.log(`Put Object to Minio Complete with name ${fileName}`);
    const fileUrl = await this.getObjectUrl(bucketName, fileName);
    return {
      fileName,
      bucketName,
      fileUrl,
    };
  }

  async checkBucketIsExist(bucket: string) {
    const existed = await this.minioClient.bucketExists(bucket);
    if (!existed) {
      throw new Error(
        `Dont existed bucket name ${this.configService.get(EnvName.MINIO_BUCKET)} create new one`,
      );
    }
  }

  private getObjectUrl(bucketName: string, objectName: string) {
    return this.minioClient.presignedGetObject(bucketName, objectName);
  }

  private async handleImageUrls(page: Page, imageUrls: string[]): Promise<ResultHandleImageUrls$V1> {
    try {
      const urlSet = new Set<string>(imageUrls);

      setTimeout(async () => {
        await this.constructHTMLImage(imageUrls, page);
        this.logger.log(`${this.handleImageUrls.name}:= Loaded Image`);
      });

      const imgResponse = await page.waitForResponse(
        (response) => {
          if (
            response.request().resourceType() == 'image' &&
            urlSet.has(response.url())
          ) {
            if (response.status() == HttpStatus.OK) {
              return true;
            } else {
              throw new Error(
                `URL ${response.url()} error with code ${response.status()}`,
              );
            }
          }

          return false;
        },
        {
          timeout: 10000 * (urlSet.size || 1),
        },
      );

      this.logger.log('Had response on url := ' + imgResponse.url());
      const buffer = await imgResponse.buffer();
      return {
        buffer,
        headers: imgResponse.headers(),
      };
    } catch (e) {
      this.logger.error(
        `Crawl Image fail url := ${JSON.stringify(imageUrls)}`,
        e,
      );
      throw e;
    }
  }

  private async handleImageUrlsV2(imageUrls: string[]) {
    return new Promise<ResultHandleImageUrls$V2>(async (resolve, reject) => {
      try {
        const tries = imageUrls.concat([]);
        let buffer: Buffer | null = null;
        let contentType: string | null = null;

        while (tries.length > 0) {
          if (buffer) break;
          const url = tries.pop();
          buffer = await new Promise<Buffer>((resolve) => {
            exec(
              `curl -s -i ${url} \
                -H 'accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' \
                -H 'accept-language: en-US,en;q=0.9,vi;q=0.8,vi-VN;q=0.7' \
                -H 'dnt: 1' \
                -H 'priority: u=1, i' \
                -H 'referer: https://nettruyenww.com/' \
                -H 'sec-ch-ua: "Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"' \
                -H 'sec-ch-ua-mobile: ?0' \
                -H 'sec-ch-ua-platform: "Linux"' \
                -H 'sec-fetch-dest: image' \
                -H 'sec-fetch-mode: no-cors' \
                -H 'sec-fetch-site: cross-site' \
                -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'`,
              { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 }, // Increase maxBuffer to 10 MB
              (error, stdout, stderr) => {
                if (error) {
                  this.logger.error(`URL error ${url}`);
                  return;
                }
                if(stderr && stderr.length > 0 ) {
                  this.logger.error(`URL stderr`);
                  return;
                }

                if (!stdout || stdout.length === 0) {
                  // If no data was returned, the fetch might have failed
                  this.logger.error('No data returned. The image might not have been fetched correctly.');
                  return;
                }

                // Convert buffer to string for header extraction, but keep it raw for the body
                const response = stdout.toString('utf8'); // Decode headers to string for easier parsing

                // Split headers and body
                const headersEndIndex = response.indexOf("\r\n\r\n");
                const headers = response.substring(0, headersEndIndex);
                const fileBuffer = stdout.subarray(headersEndIndex + 4); // Extract the body as raw buffer


                // Extract HTTP status code from the first line of the response
                const statusLine = headers.split("\r\n")[0];
                const statusCode = statusLine.split(" ")[1]; // The status code is the second part

                this.logger.log(`URL ${url} HTTP Status Code: ${statusCode}`);
                if (Number.isInteger(+statusCode) && +statusCode === 200) {
                  if (stdout && stdout.length < 1024) {
                    this.logger.error(`URL ${url} response too small`);
                    return;
                  }

                  // Extract Content-Type from headers
                  const contentTypeMatch = headers.match(/content-type:\s*(.*)/);
                  if (contentTypeMatch && contentTypeMatch[1]) {
                    contentType = contentTypeMatch[1].trim();
                  } else {
                    this.logger.error('Content-Type not found in the response headers.');
                    return;
                  }
                  resolve(fileBuffer);
                  return;
                }

                this.logger.error(`URL ${url} error with status ${statusCode}`);
              },
            );
          })
        }
        if (!buffer) throw new Error(`Not result found on ${JSON.stringify(imageUrls)}`);
        resolve({
          contentType,
          buffer,
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  private constructHTMLImage(imageUrls: string[], page: Page) {
    try {
      return page.evaluate((urls) => {
        const imgElement = document.createElement('img');
        imgElement.setAttribute('referrerpolicy', 'origin');
        imgElement.addEventListener('error', () => {
          if (urls.length == 0) {
            console.error(imgElement.src);
            return;
          }
          urls.splice(0, 1);
          imgElement.src = urls[0];
        });

        // Assign URL
        imgElement.src = urls[0];
      }, Array.from(imageUrls));
    } catch (e) {
      this.logger.error(`Construct Image error ${e}`);
      this.logger.error(e);
      console.trace(e);
    }
  }

  private async generateFileName(prefixFileName: string, contentType: string) {
    const extension = JobUtils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new Error('Unsupported content type');
    }
    const hash = nanoid(10);
    return `${prefixFileName}-${hash}.${extension}`;
  }
}
