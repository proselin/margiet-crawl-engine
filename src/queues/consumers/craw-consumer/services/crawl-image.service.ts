import { CrawlUploadService } from '@/queues/consumers/craw-consumer/services/crawl-upload.service';
import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { ImageEntity } from '@/entities/image';
import { MinioUploadHistory } from '@/entities/minio-upload-history';
import {
  CrawlThumbImage,
  CrawlUploadResponse,
  RawImage,
  UploadMinioResponse,
} from '@/common';
import { ChapterEntity } from '@/entities/chapter';
import { QueryRunner } from 'typeorm';

@Injectable()
export class CrawlImageService implements BeforeApplicationShutdown {
  private logger = new Logger(CrawlImageService.name);

  constructor(
    private crawlUploadService: CrawlUploadService,
    @InjectBrowser()
    private browser: Browser,
  ) {}

  async handleCrawlThumbUrl(page: Page, jobData: CrawlThumbImage) {
    const imageUploadedInfo =
      await this.crawlUploadService.crawlAndUploadImageToStore(
        `cm-${Date.now()}`,
        jobData.imageUrls,
      );
    return this.createImageDocument({
      ...imageUploadedInfo,
      position: 0,
      originUrls: jobData.imageUrls,
    });
  }

  async crawlAndUploadChapterImage(
    chapter: ChapterEntity,
    rawImages: RawImage[],
    queryRunner?: QueryRunner,
  ) {
    try {
      const uploadedImages = await this.crawlUploadService
        .crawlAndUploadMulti(`c-${chapter.id}`, rawImages)
        .catch((error) => {
          throw error;
        });

      const images = await Promise.all(
        uploadedImages.map(
          async (uploadedImage: CrawlUploadResponse[number]) => {
            const image = new ImageEntity();
            image.url = uploadedImage?.fileUrl ?? '';
            image.originUrls = uploadedImage.originUrls;
            image.position = uploadedImage.position;

            const uploadMinioHistory = new MinioUploadHistory();
            uploadMinioHistory.url = uploadedImage?.fileUrl;
            uploadMinioHistory.fileName = uploadedImage?.fileName;
            uploadMinioHistory.bucketName = uploadedImage?.bucketName;
            await (queryRunner
              ? queryRunner.manager.save(uploadMinioHistory)
              : uploadMinioHistory.save());

            image.minioUploadHistory = Promise.resolve(uploadMinioHistory);
            await (queryRunner
              ? queryRunner.manager.save(image)
              : image.save());
            return image;
          },
        ),
      );

      const existedImages = (await chapter?.images) ?? [];
      existedImages.push(...images);
      chapter.images = Promise.resolve(existedImages);
      // await chapter.save();

      this.logger.log(`Create ${uploadedImages.length} uploaded images`);
      this.logger.log(`Update chapter id ${chapter.id}`);
      return existedImages;
    } catch (e) {
      this.logger.error(e);
      throw new Error('Insert data image failed !!', e);
    }
  }

  async beforeApplicationShutdown() {
    await this.browser.close();
  }

  private async createImageDocument(
    uploadInfo: {
      position: number;
      originUrls: string[];
    } & Partial<UploadMinioResponse>,
  ) {
    try {
      const newImage = new ImageEntity();
      const minioUploadHistory = new MinioUploadHistory();

      minioUploadHistory.bucketName = uploadInfo?.bucketName;
      minioUploadHistory.fileName = uploadInfo?.fileName;
      minioUploadHistory.url = uploadInfo?.fileUrl;
      await minioUploadHistory.save();
      newImage.minioUploadHistory = Promise.resolve(minioUploadHistory);

      newImage.url = uploadInfo?.fileUrl;
      newImage.originUrls = uploadInfo?.originUrls;
      newImage.position = uploadInfo?.position;

      await newImage.save();

      this.logger.log(
        `[${this.createImageDocument.name}]: create image id: ${newImage.id} and url`,
        uploadInfo,
      );
      return newImage;
    } catch (e) {
      this.logger.error(
        `[${this.createImageDocument.name}]: Failed to create image with uploaded url `,
        uploadInfo,
      );
      throw e;
    }
  }
}
