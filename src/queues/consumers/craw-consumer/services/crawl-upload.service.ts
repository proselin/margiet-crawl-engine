import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { nanoid } from 'nanoid';
import { InjectMinio } from '@margiet-libs/minio';

import {
  CrawlUploadResponse,
  RawImage,
  ResultHandleImageUrls$V2,
  UploadMinioResponse,
} from '../../../../common';
import { Utils } from '../../../../utils';
import { NettruyenHttpService } from './nettruyen-http.service';

@Injectable()
export class CrawlUploadService {
  private logger = new Logger(CrawlUploadService.name);

  constructor(
    private configService: ConfigService,
    @InjectMinio() private readonly minioClient: MinioClient,
    private nettruyenHttService: NettruyenHttpService,
  ) {}

  get minioBucket() {
    return this.configService.get('minio.bucket');
  }

  async crawlAndUploadImageToStore(
    prefixFileName: string,
    svUrls: string[],
    domain: string,
  ) {
    const { buffer, contentType } = await this.handleImageUrls(svUrls, domain);
    const fileName = await this.generateFileName(prefixFileName, contentType);

    return this.uploadToMinio(buffer, contentType, fileName, this.minioBucket);
  }

  async crawlAndUploadMulti(
    prefixFileName: string,
    data: RawImage[],
    domain: string,
  ): Promise<CrawlUploadResponse> {
    return Promise.all(
      data.map(async (item) => {
        try {
          const { buffer, contentType } = await this.handleImageUrls(
            item.imageUrls,
            domain,
          );
          const fileName = await this.generateFileName(
            prefixFileName,
            contentType,
          );

          const uploadResponse = await this.uploadToMinio(
            buffer,
            contentType,
            fileName,
            this.minioBucket,
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
        `Dont existed bucket name ${this.configService.get('minio.bucket')} create new one`,
      );
    }
  }

  private getObjectUrl(bucketName: string, objectName: string) {
    return this.minioClient.presignedGetObject(bucketName, objectName);
  }

  private async handleImageUrls(imageUrls: string[], domain: string) {
    return new Promise<ResultHandleImageUrls$V2>(async (resolve, reject) => {
      try {
        const tries = imageUrls.concat([]);
        let buffer: Buffer | null = null;
        let contentType: string | null = null;

        while (tries.length > 0) {
          if (buffer) break;
          const url = tries.pop();
          // await this.nettruyenHttService.executeCurl(url, domain).then((r) => {
          //   buffer = r.fileBuffer;
          //   contentType = r.contentType;
          // });
          await this.nettruyenHttService.getImages(url, domain).then(
            r => {
              buffer = r.data
              contentType = r.headers['content-type']
            }
          )
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

  private async generateFileName(prefixFileName: string, contentType: string) {
    const extension = Utils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new Error('Unsupported content type');
    }
    const hash = nanoid(10);
    return `${prefixFileName}-${hash}.${extension}`;
  }
}
