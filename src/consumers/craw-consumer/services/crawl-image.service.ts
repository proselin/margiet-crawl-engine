import { Injectable, Logger } from "@nestjs/common";

import { UploadService } from "./upload.service";
import { ImageEntity } from "../../../entities/image";
import { CrawlImageJobData, ResultHandleImageUrls$V2, UploadDriveResponse, UploadMinioResponse } from "../../../common";
import { MinioUploadHistory } from "../../../entities/minio-upload-history";
import { ImageType } from "../../../common/constant/image";
import { Job } from "bullmq";
import { NettruyenHttpService } from "./nettruyen-http.service";
import { nanoid } from "nanoid";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DriverUploadHistory } from "../../../entities/driver-upload-history";

@Injectable()
export class CrawlImageService {
  private logger = new Logger(CrawlImageService.name);

  constructor(
    private uploadService: UploadService,
    private http: NettruyenHttpService,
    @InjectRepository(ImageEntity)
    private imageRepository: Repository<ImageEntity>,
  ) {}

  async handleCrawlImageToDrive(job: Job<CrawlImageJobData>) {
    try {
      const uploadedInfo = await this.handleCrawlNettruyenImageToDrive(
        `ci-${nanoid(6)}`,
        job.data.dataUrls,
        job.data.domain,
      );

      return this.createImageWithDriveHistory(
        {
          ...uploadedInfo,
          position: job.data.position,
          originUrls: job.data.dataUrls,
          type: job.data.type,
        },
        job.data.comicId!,
        job.data.chapterId!,
      );
    } catch (error) {
      this.logger.log(`Fail [handleCrawlImageToDrive] with jodId ${job.id}`);
      this.logger.error(error);
      throw error;
    }
  }

  private async createImageDocument(
    uploadedImage: UploadMinioResponse & {
      originUrls: string[];
      position: number;
      type: ImageType;
    },
    comicId?: number,
    chapterId?: number,
  ) {
    try {
      this.logger.log(
        `[${this.createImageDocument.name}]: START create image with file name ${uploadedImage.fileName}`,
      );

      const uploadMinioHistory = new MinioUploadHistory();
      uploadMinioHistory.url = uploadedImage?.fileUrl;
      uploadMinioHistory.fileName = uploadedImage?.fileName;
      uploadMinioHistory.bucketName = uploadedImage?.bucketName ?? "";
      await uploadMinioHistory.save();

      const image = this.imageRepository.create({
        url: uploadedImage?.fileUrl ?? "",
        originUrls: uploadedImage.originUrls,
        position: uploadedImage.position,
        type: uploadedImage.type,
        chapter: {
          id: chapterId,
        },
        comic: {
          id: comicId,
        },
        minioUploadHistory: uploadMinioHistory,
      });
      await this.imageRepository.save(image);

      this.logger.log(`[${this.createImageDocument.name}]: DONE create image with file name ${uploadedImage.fileName}`);
      return image.id;
    } catch (e) {
      this.logger.error(`[${this.createImageDocument.name}]: Failed to create image with uploaded url `);
      this.logger.error(e);
      throw e;
    }
  }

  private async createImageWithDriveHistory(
    uploadedImage: UploadDriveResponse & {
      originUrls: string[];
      position: number;
      type: ImageType;
    },
    comicId?: number,
    chapterId?: number,
  ) {
    try {
      this.logger.log(
        `[${this.createImageDocument.name}]: START create image with file name ${uploadedImage.fileName}`,
      );

      const driverUploadHistory = new DriverUploadHistory();
      driverUploadHistory.url = uploadedImage?.fileUrl;
      driverUploadHistory.fileName = uploadedImage?.fileName;
      driverUploadHistory.parentFolderId = uploadedImage?.parentFolderId;
      await driverUploadHistory.save();

      const image = this.imageRepository.create({
        url: uploadedImage?.fileUrl ?? "",
        originUrls: uploadedImage.originUrls,
        position: uploadedImage.position,
        type: uploadedImage.type,
        chapter: {
          id: chapterId,
        },
        comic: {
          id: comicId,
        },
        driverUploadHistory,
      });
      await this.imageRepository.save(image);

      this.logger.log(`[${this.createImageDocument.name}]: DONE create image with file name ${uploadedImage.fileName}`);
      return image.id;
    } catch (e) {
      this.logger.error(`[${this.createImageDocument.name}]: Failed to create image with uploaded url `);
      this.logger.error(e);
      throw e;
    }
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
          await this.http.getImages(url, domain).then(r => {
            buffer = r.data;
            contentType = r.headers["content-type"];
          });
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

  private async handleCrawlNettruyenImageToDrive(prefixFileName: string, svUrls: string[], domain: string) {
    this.logger.log(
      `Start [handleCrawlNettruyenImageToDrive] with svUrls=${JSON.stringify(svUrls)} domain=${domain} prefixFileName=${prefixFileName} `,
    );
    try {
      const { buffer, contentType } = await this.handleImageUrls(svUrls, domain);
      const fileName = await this.uploadService.generateFileName(prefixFileName, contentType);

      return this.uploadService.uploadToDriveGoogle(buffer, contentType, fileName);
    } catch (e) {
      this.logger.log("Fail to Crawl and upload file");
      this.logger.error(e);
      throw e;
    }
  }
}
