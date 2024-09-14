import { UploadMinioResponse } from '@/jobs/shared';
import { JobUtils } from '@/jobs/shared/utils';
import { EnvKey } from '@/environment';
import { InjectMinio } from '@libs/minio';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { nanoid } from 'nanoid';
import { Page } from 'puppeteer';

@Injectable()
export class CrawlUploadService {
  private logger = new Logger(CrawlUploadService.name);

  constructor(
    private configService: ConfigService,
    @InjectMinio() private readonly minioClient: MinioClient,
  ) {}

  async crawlAndUploadImageToStore(
    page: Page,
    prefixFileName: string,
    svUrls: string[],
  ) {
    const responseSvData = await this.handleImageUrls(page, svUrls);
    const contentType = responseSvData.headers?.['content-type'];
    const fileName = await this.generateFileName(prefixFileName, contentType);

    return this.uploadToMinio(
      responseSvData.buffer,
      contentType,
      fileName,
      this.configService.get(EnvKey.MINIO_BUCKET),
    );
  }

  async crawlAndUploadMulti(
    page: Page,
    prefixFileName: string,
    data: {
      imageUrls: string[];
      position: number;
    }[],
  ) {
    page.off('request');

    return Promise.all(
      data.map(async (rawCrawlData) => {
        setTimeout(() => {
          this.constructHTMLImage(rawCrawlData.imageUrls, page);
        });
        const response = await page.waitForResponse(async (response) => {
          return (
            response.request().resourceType() == 'image' &&
            response.status() == HttpStatus.OK &&
            rawCrawlData.imageUrls.indexOf(response.url()) != -1
          );
        });
        this.logger.log('Had response on url := ' + response.url());
        const buffer = await response.buffer();
        const contentType = response.headers()?.['content-type'];
        const fileName = await this.generateFileName(
          prefixFileName,
          contentType,
        );

        return this.uploadToMinio(
          buffer,
          contentType,
          fileName,
          this.configService.get(EnvKey.MINIO_BUCKET),
        );
      }),
    );
  }

  async uploadToMinio(
    file: Buffer,
    contentType: string,
    fileName: string,
    bucketName: string,
  ): Promise<UploadMinioResponse> {
    try {
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
    } catch (e) {
      throw e;
    }
  }

  async checkBucketIsExist(bucket: string) {
    const existed = await this.minioClient.bucketExists(bucket);
    if (!existed) {
      throw new Error(
        `Dont existed bucket name ${this.configService.get(EnvKey.MINIO_BUCKET)} create new one`,
      );
    }
  }

  private getObjectUrl(bucketName: string, objectName: string) {
    return this.minioClient.presignedGetObject(bucketName, objectName);
  }

  private async handleImageUrls(page: Page, imageUrls: string[]) {
    try {
      const urlSet = new Set<string>(imageUrls);

      setTimeout(async () => {
        await this.constructHTMLImage(imageUrls, page);
        this.logger.log(`${this.handleImageUrls.name}:= Loaded Image`);
      });

      const imgResponse = await page.waitForResponse(
        (response) => {
          return (
            response.request().resourceType() == 'image' &&
            response.status() == HttpStatus.OK &&
            urlSet.has(response.url())
          );
        },
        {
          timeout: 20000 * (urlSet.size || 1),
        },
      );

      this.logger.log('Had response on url := ' + imgResponse.url());
      const buffer = await imgResponse.buffer();
      return {
        buffer,
        headers: imgResponse.headers(),
      };
    } catch (e) {
      this.logger.error(`Crawl Image fail url := ${JSON.stringify(imageUrls)}`);
      this.logger.error(e);
      console.trace(e);
      throw e;
    }
  }

  private constructHTMLImage(imageUrls: string[], page: Page) {
    try {
      return page.evaluate((urls) => {
        const imgElement = document.createElement('img');
        imgElement.setAttribute('referrerpolicy', 'origin');
        imgElement.addEventListener('load', (e) => {
          console.log('Loaded Image', e);
        });
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
