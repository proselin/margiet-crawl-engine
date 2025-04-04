import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client as MinioClient } from "minio";
import { nanoid } from "nanoid";
import { InjectMinio } from "@margiet-libs/minio";

import { UploadMinioResponse } from "../../../common";
import { Utils } from "../../../utils";

interface IUploadService {
  uploadToPublicMinio(
    file: Buffer,
    contentType: string,
    fileName: string,
    bucketName: string,
  ): Promise<UploadMinioResponse>;

  generateFileName(prefixFileName: string, contentType: string): Promise<string>;
}

@Injectable()
export class UploadService implements IUploadService {
  private logger = new Logger(UploadService.name);

  constructor(
    private configService: ConfigService,
    @InjectMinio() private readonly minioClient: MinioClient,
  ) {}

  private get minioBucket() {
    return this.configService.get("minio.bucket");
  }

  async uploadToPublicMinio(
    file: Buffer,
    contentType: string,
    fileName: string,
    bucketName: string = this.minioBucket,
  ): Promise<UploadMinioResponse> {
    this.logger.log(
      `Start uploading minio bucket from publicMinio with params contentType=${contentType} fileName=${fileName} bucketName=${bucketName}`,
    );
    await this.checkBucketIsExist(bucketName);
    await this.minioClient.putObject(bucketName, fileName, file, undefined, {
      "Content-Type": contentType,
    });
    const fileUrl = await this.getObjectUrl(bucketName, fileName);
    this.logger.log(`Done uploading minio bucket from publicMinio`);
    return {
      fileName,
      bucketName,
      fileUrl,
    };
  }

  private async checkBucketIsExist(bucket: string) {
    const existed = await this.minioClient.bucketExists(bucket);
    if (!existed) {
      throw new Error(`Dont existed bucket name ${this.configService.get("minio.bucket")} create new one`);
    }
  }

  private getObjectUrl(bucketName: string, objectName: string) {
    return this.minioClient.presignedGetObject(bucketName, objectName);
  }

  async generateFileName(prefixFileName: string, contentType: string) {
    const extension = Utils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new Error("Unsupported content type");
    }
    const hash = nanoid(10);
    return `${prefixFileName}-${hash}.${extension}`;
  }
}
