import { CrawlUploadService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-upload.service';
import {
  CrawlChapterImages,
  CrawlThumbImage,
} from '@crawl-engine/bull/shared/types';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { Image } from '@crawl-engine/image/image.schema';
import { ImageService } from '@crawl-engine/image/image.service';
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
    return this.createImageDocument(imageUploadedInfo.fileUrl, 0);
  }

  async handleCrawlAndUploadChapterImage(
    page: Page,
    jobData: CrawlChapterImages,
  ) {
    const uploadedImages = await this.crawlUploadService.crawlAndUploadMulti(page, `c-${jobData.chapterId}`, jobData.images)
    const newImages = await this.imageService.model.create(uploadedImages.map((uploadedImage, i) => {
        return {
          url: uploadedImage.fileUrl,
          position: i,
        }
      }), {
      ordered: true
    })
    this.logger.log(`Create ${newImages.length} uploaded images`);
    await this.updateChapter({
      images: newImages.map((r) => r.id)
    }, jobData.chapterId)
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

  private async abortRequest(page: Page, originURl: string) {
    page.on('request', (request) => {
      const url = request.url();
      if (url == originURl) {
        request.continue();
        return;
      }
      request.abort('blockedbyclient');
    });
  }

  private async createImageDocument(uploadedUrl: string, index: number) {
    try {
      const rs = await this.imageService.createOne({
        url: uploadedUrl,
        position: index,
      });
      this.logger.log(
        `[${this.createImageDocument.name}]: create image id: ${rs.id} and url ${uploadedUrl}`,
      );
      return rs;
    } catch (e) {
      this.logger.error(
        `[${this.createImageDocument.name}]: Failed to create image with uploaded url ${uploadedUrl}`,
      );
      throw e;
    }
  }
}
