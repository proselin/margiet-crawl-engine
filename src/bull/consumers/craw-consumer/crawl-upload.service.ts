import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { GDUploadFileRequest, GoogleDriveService } from '@libs/google-drive';
import { ConfigService } from '@nestjs/config';
import { JobUtils } from '@crawl-engine/bull/shared/utils';
import { v1 } from 'uuid';
import { EnvKey } from '@crawl-engine/environment';
import { Client as MinioClient } from 'minio';
import { InjectMinio } from '@libs/minio';

@Injectable()
export class CrawlUploadService {
  private logger = new Logger(CrawlUploadService.name);

  constructor(
    private googleDriveService: GoogleDriveService,
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

    const putTo = this.configService.get(EnvKey.SAVE_STRATEGIES, "MINIO")
    switch (putTo) {
      case 'MINIO': {
        return this.uploadToMinio(
          responseSvData.buffer,
          contentType,
          fileName,
          this.configService.get(EnvKey.MINIO_BUCKET)
        )
      }
      case "DRIVE": {
        return this.uploadFileToDrive(responseSvData.buffer, contentType, fileName)
      }
      default: throw new Error("Dont understand strategies")
    }
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

        const putTo = this.configService.get(EnvKey.SAVE_STRATEGIES, "MINIO")
        switch (putTo) {
          case 'MINIO': {
            return this.uploadToMinio(
              buffer,
              contentType,
              fileName,
              this.configService.get(EnvKey.MINIO_BUCKET)
            )
          }
          case "DRIVE": {
            return this.uploadFileToDrive(buffer, contentType, fileName).then(
              (r) => {
                return {
                  ...r,
                  position: rawCrawlData.position,
                };
              },
            );
          }
          default: throw new Error("Dont understand strategies")
        }
      }),
    );
  }

  private async uploadFileToDrive(
    file: Buffer,
    contentType: string,
    fileName: string,
    folderId?: string,
  ) {
    try {
      const body = GoogleDriveService.bufferToStream(file);

      const requestUploadFile: GDUploadFileRequest = {
        body: body,
        fileName,
        mimeType: contentType,
        folderId: folderId ?? this.configService.get(EnvKey.G_FOLDER_ID),
      };

      const result =
        await this.googleDriveService.uploadFile(requestUploadFile);

      this.logger.log(
        `[${this.uploadFileToDrive.name}]:: ` +
          'File uploaded to Google Drive: ' +
          JSON.stringify(result),
      );
      return result;
    } catch (e) {
      throw e;
    }
  }

  async uploadToMinio(file: Buffer, contentType: string, fileName: string, bucketName: string) {
    try {

      await this.checkBucketIsExist(bucketName);
      // await this.setBucketPolicyPublic(bucketName)
      await this.minioClient.putObject(bucketName, fileName, file, undefined, {
        'Content-Type': contentType,
      })
      this.logger.log(`Put Object to Minio Complete with name ${fileName}`)
      const fileUrl = await this.getObjectUrl(bucketName, fileName)
      return {
        fileUrl,
      }
    } catch (e) {
      throw e;
    }
  }

  private getObjectUrl(bucketName: string, objectName: string) {
    return this.minioClient.presignedGetObject(bucketName, objectName);
  }

  // async setBucketPolicyPublic(bucketName: string) {
  //   const isPublic = this.isBucketPublic(bucketName)
  //   if(isPublic) return
  //     const policy = {
  //       Version: new Date().toISOString(),
  //       Statement: [
  //         {
  //           Effect: 'Allow',
  //           Principal: '*',
  //           Action: 's3:GetObject',
  //           Resource: `arn:aws:s3:::${bucketName}/*`,
  //         },
  //       ],
  //     };
  //
  //     await this.minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
  // }


  async isBucketPublic(bucketName: string): Promise<boolean> {
    try {
      const policy = await this.minioClient.getBucketPolicy(bucketName);
      const policyDoc = JSON.parse(policy);

      return policyDoc.Statement.some((statement: any) =>
        statement.Effect === 'Allow' &&
        statement.Principal === '*' &&
        statement.Action === 's3:GetObject' &&
        statement.Resource === `arn:aws:s3:::${bucketName}/*`
      );
    } catch (error) {
      throw new Error(`Failed to check bucket policy: ${error.message}`);
    }
  }

  async checkBucketIsExist(bucket: string) {
    const existed = await this.minioClient.bucketExists(bucket)
    if (!existed) {
     throw new Error(`Dont existed bucket name ${ this.configService.get(EnvKey.MINIO_BUCKET)} create new one`)
    }
  }

  private async handleImageUrls(page: Page, imageUrls: string[]) {
    try {
      const urlSet = new Set<string>(imageUrls);
      page.off('request');

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
        imgElement.addEventListener('error', (ev) => {
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
    const hash = v1();
    return `${prefixFileName}-${hash}.${extension}`;
  }
}
