import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { nanoid } from 'nanoid';
import { InjectMinio } from '@margiet-libs/minio';
import { Utils } from '../../../../utils';
import { NettruyenHttpService } from './nettruyen-http.service';
import {
  IExtractImageResult$1,
  IResultGetImageFromUrls$1,
  IUploadImageResultModel$1,
  IUploadMinioResponse$1,
} from '../../../../models';

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
    const { buffer, contentType } = await this.getImageFromUrls(svUrls, domain);
    const fileName = await this.generateFileName(prefixFileName, contentType);

    return this.uploadToMinio(buffer, contentType, fileName, this.minioBucket);
  }

  async crawlNUploadImages(
    prefixFileName: string,
    data: IExtractImageResult$1[],
    domain: string,
  ): Promise<IUploadImageResultModel$1[]> {
    const processImages: Promise<IUploadImageResultModel$1>[] = data.map(
      async (item) => {
        const { buffer, contentType } = await this.getImageFromUrls(
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
        } satisfies IUploadImageResultModel$1;
      },
    );
    return Promise.all(processImages);
  }

  async uploadToMinio(
    file: Buffer,
    contentType: string,
    fileName: string,
    bucketName: string,
  ): Promise<IUploadMinioResponse$1> {
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
    } satisfies IUploadMinioResponse$1;
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

  private async getImageFromUrls(imageUrls: string[], domain: string) {
    return new Promise<IResultGetImageFromUrls$1>(async (resolve, reject) => {
      try {
        const tries = imageUrls.concat([]);
        let buffer: Buffer | null = null;
        let contentType: string | null = null;

        while (tries.length > 0) {
          if (buffer) break;
          const url = tries.pop();
          const response = await this.nettruyenHttService.getImages(
            url,
            domain,
          );
          buffer = response.data;
          contentType = response.headers['content-type'];
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
