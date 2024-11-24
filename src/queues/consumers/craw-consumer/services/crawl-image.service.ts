import { CrawlUploadService } from '@/queues/consumers/craw-consumer/services/crawl-upload.service';
import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { ImageEntity } from '@/entities/image';
import { MinioUploadHistory } from '@/entities/minio-upload-history';
import {
  CrawlChapterImages,
  CrawlThumbImage,
  CrawlUploadResponse,
  UploadMinioResponse,
} from '@/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChapterEntity } from '@/entities/chapter';
import { Repository } from 'typeorm';

@Injectable()
export class CrawlImageService implements BeforeApplicationShutdown {
  private logger = new Logger(CrawlImageService.name);

  constructor(
    @InjectRepository(ChapterEntity)
    private chapterRepository: Repository<ChapterEntity>,
    private crawlUploadService: CrawlUploadService,

    @InjectBrowser()
    private browser: Browser,
  ) {}

  async handleCrawlThumbUrl(page: Page, jobData: CrawlThumbImage) {
    const imageUploadedInfo =
      await this.crawlUploadService.crawlAndUploadImageToStore(
        page,
        `cm-${Date.now()}`,
        jobData.imageUrls,
      );
    return this.createImageDocument({
      ...imageUploadedInfo,
      position: 0,
      originUrls: jobData.imageUrls,
    });
  }

  async crawlAndUploadChapterImage(page: Page, jobData: CrawlChapterImages) {
    try {
      const chapter = await this.chapterRepository.findOne({
        where: {
          id: jobData.chapterId,
        },
      });

      const uploadedImages = await this.crawlUploadService
        .crawlAndUploadMulti(page, `c-${jobData.chapterId}`, jobData.images)
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
            await uploadMinioHistory.save();

            image.minioUploadHistory = uploadMinioHistory;
            await image.save();
            return image;
          },
        ),
      );

      chapter.images.push(...images);
      await chapter.save();

      this.logger.log(`Create ${uploadedImages.length} uploaded images`);
      this.logger.log(`Update chapter id ${jobData.chapterId}`);
      return images;
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
      newImage.minioUploadHistory = minioUploadHistory;

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
