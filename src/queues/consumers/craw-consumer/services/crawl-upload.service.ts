import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { nanoid } from 'nanoid';
import { InjectMinio } from '@margiet-libs/minio';
import { EnvName } from '@/common/constant/env';
import { Utils } from '@/utils/utils';
import {
  CrawlUploadResponse,
  ExecuteCurlResult,
  RawImage,
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

  async crawlAndUploadImageToStore(prefixFileName: string, svUrls: string[]) {
    const { buffer, contentType } = await this.handleImageUrls(svUrls);
    const fileName = await this.generateFileName(prefixFileName, contentType);
    const minioBucket = this.configService.get(EnvName.MINIO_BUCKET);
    return this.uploadToMinio(buffer, contentType, fileName, minioBucket);
  }

  async crawlAndUploadMulti(
    prefixFileName: string,
    data: RawImage[],
  ): Promise<CrawlUploadResponse> {
    const minioBucket: string = this.configService.get(EnvName.MINIO_BUCKET);
    return Promise.all(
      data.map(async (item) => {
        try {
          const { buffer, contentType } = await this.handleImageUrls(
            item.imageUrls,
          );
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

  private async handleImageUrls(imageUrls: string[]) {
    return new Promise<ResultHandleImageUrls$V2>(async (resolve, reject) => {
      try {
        const tries = imageUrls.concat([]);
        let buffer: Buffer | null = null;
        let contentType: string | null = null;

        while (tries.length > 0) {
          if (buffer) break;
          const url = tries.pop();
          await this.executeCurl(url).then((r) => {
            buffer = r.fileBuffer;
            contentType = r.contentType;
          });
        }
        if (!buffer)
          throw new Error(`Not result found on ${JSON.stringify(imageUrls)}`);
        resolve({
          contentType,
          buffer,
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  private async executeCurl(url: string): Promise<ExecuteCurlResult> {
    return new Promise<ExecuteCurlResult>((resolve, reject) => {
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
            reject(error);
            return;
          }
          if (stderr && stderr.length > 0) {
            this.logger.error(`URL stderr`);
            reject(stderr.toString());
            return;
          }

          if (!stdout || stdout.length === 0) {
            // If no data was returned, the fetch might have failed
            this.logger.error(
              'No data returned. The image might not have been fetched correctly.',
            );
            reject(
              'No data returned. The image might not have been fetched correctly.',
            );
            return;
          }

          // Convert buffer to string for header extraction, but keep it raw for the body
          const response = stdout.toString('utf8'); // Decode headers to string for easier parsing

          // Split headers and body
          const headersEndIndex = response.indexOf('\r\n\r\n');
          const headers = response.substring(0, headersEndIndex);
          const fileBuffer = stdout.subarray(headersEndIndex + 4); // Extract the body as raw buffer

          // Extract HTTP status code from the first line of the response
          const statusLine = headers.split('\r\n')[0];
          const statusCode = statusLine.split(' ')[1]; // The status code is the second part
          let contentType = null;

          this.logger.log(`URL ${url} HTTP Status Code: ${statusCode}`);
          if (Number.isInteger(+statusCode) && +statusCode === 200) {
            if (stdout && stdout.length < 1024) {
              this.logger.error(`URL ${url} response too small`);
              reject(`URL ${url} response too small`);
              return;
            }

            // Extract Content-Type from headers
            const contentTypeMatch = headers.match(/content-type:\s*(.*)/);
            if (contentTypeMatch && contentTypeMatch[1]) {
              contentType = contentTypeMatch[1].trim();
            } else {
              this.logger.error(
                'Content-Type not found in the response headers.',
              );
              reject('Content-Type not found in the response headers.');
              return;
            }
            resolve({
              fileBuffer,
              contentType,
            });
            return;
          }

          this.logger.error(`URL ${url} error with status ${statusCode}`);
          reject(`URL ${url} error with status ${statusCode}`);
        },
      );
    });
  }

  private async generateFileName(prefixFileName: string, contentType: string) {
    const extension = Utils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new Error('Unsupported content type');
    }
    const hash = nanoid(10);
    return `${prefixFileName}-${hash}.${extension}`;
  }
}
