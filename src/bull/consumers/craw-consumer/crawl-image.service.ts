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
      await this.crawlUploadService.crawlAndUploadImageToDriver(
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
    const rs: Image[] = [];
    for (const image of jobData.images) {
      const imageUploadedInfo =
        await this.crawlUploadService.crawlAndUploadImageToDriver(
          page,
          `c-${jobData.chapterId}-i-${image.position}`,
          image.imageUrls,
        );
      const newImage = await this.createImageDocument(
        imageUploadedInfo.fileUrl,
        image.position,
      );

      await this.updateChapter(
        {
          images: newImage,
        },
        jobData.chapterId,
      );

      rs.push(newImage);
    }
    return rs;
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
