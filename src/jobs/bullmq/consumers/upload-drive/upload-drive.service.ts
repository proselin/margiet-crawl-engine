import { Injectable, Logger } from '@nestjs/common';
import { UploadImageJobData } from './types';
import { Job } from 'bullmq';
import { ImageService } from '@/entities/image/image.service';
import { ImageDocument } from '@/entities/image/image.schema';
import { Client as MinioClient } from 'minio';
import { Stream } from 'stream';
import { ConfigService } from '@nestjs/config';
import { drive_v3 } from 'googleapis';
import { GDUploadFileRequest, GoogleDriveService } from 'mar-google-drive';
import { SyncComicRmqProducer } from '@/jobs/rabbitmq/producer/sync-comic-rmq.producer';
import { InjectMinio } from '@/libs/minio';

@Injectable()
export class UploadDriveService {
  private readonly logger = new Logger(UploadDriveService.name);
  constructor(
    private configService: ConfigService,
    private readonly driveApiService: GoogleDriveService,
    private imageService: ImageService,
    private syncComicRmqProducer: SyncComicRmqProducer,
    @InjectMinio()
    private readonly minioClient: MinioClient,
  ) {}

  async handleUploadImage(job: Job<UploadImageJobData>) {
    this.logger.log(`:= Handle job ${job.name} with id ${job.token}`);
    try {
      const imageDoc = await this.getImageDataFromDB(job.data.id);
      await this.validateDataFromDB(imageDoc);
      const streamFromMinio = await this.retriveDataFromMinio(
        imageDoc.minioInfo,
      );
      const uploadResponse = await this.uploadFileToDrive(
        streamFromMinio,
        imageDoc.minioInfo.bucketName,
        imageDoc.minioInfo.fileName,
      );
      imageDoc.driverInfo = <any>{};
      imageDoc.driverInfo.driverId = uploadResponse.id;
      imageDoc.driverInfo.fileName = uploadResponse.name;
      imageDoc.driverInfo.parentFolderId =
        this.configService.get('G_FOLDER_ID');
      imageDoc.driverInfo.url = uploadResponse.fileUrl;

      return imageDoc.save().then(async (document) => {
        this.logger.log(
          `[${this.handleUploadImage.name}]::= Complete upload Image`,
        );
        await this.syncComicRmqProducer.pushMessageSyncImage(
          document,
          job.data.chapterId,
        );
        return document;
      });
    } catch (e) {
      this.logger.error(
        `[${this.handleUploadImage.name}]::= Fail to handle upload image`,
      );
      this.logger.error(e);
      throw e;
    }
  }

  async getImageDataFromDB(id: string) {
    if (!id) throw new Error('Dont have id value !');
    const exist = (await this.imageService.model.findById(id)) as ImageDocument;
    if (!exist) throw new Error('Dont found any id like this !');
    return exist;
  }

  async validateDataFromDB(exist: ImageDocument) {
    if (!exist.minioInfo || !exist.minioInfo.url)
      throw new Error('Dont found any minio info !');
    const existBucket = await this.minioClient.bucketExists(
      exist.minioInfo.bucketName,
    );
    if (!existBucket) throw new Error('Bucket dont exist !');
    await this.minioClient.statObject(
      exist.minioInfo.bucketName,
      exist.minioInfo.fileName,
    );
  }

  private async uploadFileToDrive(
    file: Stream,
    bucketName: string,
    fileName: string,
  ): Promise<drive_v3.Schema$File & { fileUrl: string }> {
    try {
      const stat = await this.minioClient.statObject(bucketName, fileName);
      const requestUploadFile: GDUploadFileRequest = {
        body: file,
        fileName,
        mimeType: stat.metaData['Content-Type'] || 'application/octet-stream',
        folderId: this.configService.get('G_FOLDER_ID'),
      };

      const uploadResponse =
        await this.driveApiService.uploadFile(requestUploadFile);
      const fileUrl = await this.driveApiService.getFileURL(
        uploadResponse.data.id,
      );
      this.logger.log(
        `[${this.uploadFileToDrive.name}]:: ` +
          'File uploaded to Google Drive: ' +
          JSON.stringify(uploadResponse),
      );
      return {
        fileUrl,
        ...uploadResponse.data,
      };
    } catch (e) {
      this.logger.error(
        `[${this.uploadFileToDrive.name}]::= Upload to drive error `,
      );
      throw e;
    }
  }

  retriveDataFromMinio(minioInfo: { bucketName: string; fileName: string }) {
    return this.minioClient.getObject(minioInfo.bucketName, minioInfo.fileName);
  }
}
