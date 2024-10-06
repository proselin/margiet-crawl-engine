import { ChapterService } from '@/models/chapter/chapter.service';
import { ImageService } from '@/models/image/image.service';
import { CrawlUploadService } from '@/jobs/consumers/craw-consumer/crawl-upload.service';
import {
  CrawlChapterImages,
  CrawlThumbImage,
  UploadMinioResponse,
} from '@/jobs/shared/types';
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

  async handleCrawlAndUploadChapterImage(
    page: Page,
    jobData: CrawlChapterImages,
  ) {
    const uploadedImages = await this.crawlUploadService
      .crawlAndUploadMulti(page, `c-${jobData.chapterId}`, jobData.images)
      .then((r) =>
        r.map((uploadedImage) => {
          return {
            url: uploadedImage?.fileUrl ?? '',
            originalUrl: uploadedImage.originUrls,
            minioInfo: {
              url: uploadedImage?.fileUrl,
              fileName: uploadedImage?.fileName,
              bucketName: uploadedImage?.bucketName,
            },
            position: uploadedImage.position,
          };
        }),
      );

    const newImages = await this.imageService.model
      .insertMany(uploadedImages)
      .catch((e) => {
        this.logger.error(e)
        throw new Error("Insert data image failed !!")
      });
    this.logger.verbose(JSON.stringify(newImages));
    this.logger.log(`Create ${uploadedImages.length} uploaded images`);
    await this.updateChapter(
      {
        images: newImages,
      },
      jobData.chapterId,
    );
    this.logger.log(`Update chapter id ${jobData.chapterId}`);
    return newImages;
  }

  async updateChapter(pushModel: Record<string, any>, chapterId: string) {
    try {
      return await this.chapterService.findByIdAndUpdate(
        { _id: chapterId },
        { $push: pushModel },
      );
    } catch (e) {
      throw e;
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
      const rs = await this.imageService.createOne({
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
        `[${this.createImageDocument.name}]: create image id: ${rs.id} and url`,
        uploadInfo,
      );
      return rs;
    } catch (e) {
      this.logger.error(
        `[${this.createImageDocument.name}]: Failed to create image with uploaded url `,
        uploadInfo,
      );
      throw e;
    }
  }
}
