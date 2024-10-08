import { ChapterService } from '@/entities/chapter/chapter.service';
import { ImageService } from '@/entities/image/image.service';
import { CrawlUploadService } from '@/jobs/bullmq/consumers/craw-consumer/crawl-upload.service';
import {
  CrawlChapterImages,
  CrawlThumbImage,
  UploadMinioResponse,
} from '@/jobs/bullmq/shared/types';
import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';

@Injectable()
export class CrawlImageService implements BeforeApplicationShutdown {
  private logger = new Logger(CrawlImageService.name);

  constructor(
    private imageService: ImageService,
    private chapterService: ChapterService,
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

  async crawlAndUploadChapterImage(
    page: Page,
    jobData: CrawlChapterImages,
  ) {
    const uploadedImages = await this.crawlUploadService
      .crawlAndUploadMulti(page, `c-${jobData.chapterId}`, jobData.images)
      .then((response) =>
        response.map((uploadedImage) => {
          return new this.imageService.model({
            url: uploadedImage?.fileUrl ?? '',
            originalUrl: uploadedImage.originUrls,
            minioInfo: {
              url: uploadedImage?.fileUrl,
              fileName: uploadedImage?.fileName,
              bucketName: uploadedImage?.bucketName,
            },
            position: uploadedImage.position,
          });
        }),
      );

    const newImages = await this.imageService.model
      .insertMany(uploadedImages)
      .catch((e) => {
        this.logger.error(e);
        throw new Error('Insert data image failed !!');
      });
    this.logger.log(`Create ${uploadedImages.length} uploaded images`);
    await this.chapterService.updateChapterImages(newImages, jobData.chapterId);
    this.logger.log(`Update chapter id ${jobData.chapterId}`);
    return newImages;
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
      const newImage = await this.imageService.createOne({
        url: uploadInfo?.fileUrl,
        originUrls: uploadInfo?.originUrls,
        minioInfo: {
          bucketName: uploadInfo?.bucketName,
          fileName: uploadInfo?.fileName,
          url: uploadInfo?.fileUrl,
        },
        position: uploadInfo?.position,
      });
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
