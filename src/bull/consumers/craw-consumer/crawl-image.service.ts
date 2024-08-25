import {
  CrawlChapterImages,
  CrawlImageData,
  CrawlThumbImage,
} from '@crawl-engine/bull/shared/types';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { ImageService } from '@crawl-engine/image/image.service';
import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { CrawlUploadService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-upload.service';

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

  async handleCrawlJob(job: Job<CrawlImageData>) {
    const page = await this.browser.newPage();
    try {
      this.logger.log(
        `Process crawl job image ${job.token} with ChapterUrl ${job.data.goto}`,
      );
      await page.setRequestInterception(true);
      await this.abortRequest(page, job.data.goto);
      await page.goto(job.data.goto, {
        timeout: 0,
        waitUntil: 'domcontentloaded',
      });

      await page.evaluate('document.write()');
      page.off('request');
      await page.setRequestInterception(false);

      if (!job.data.isCrawlThumb) {
        return await this.handleUploadChapterImage(
          page,
          job.data as CrawlChapterImages,
        ).then(async (r) => {
          await page.close();
          return r;
        });
      }
      return await this.handleCrawlThumbUrl(
        page,
        job.data as CrawlThumbImage,
      ).then(async (r) => {
        await page.close();
        return r;
      });
    } catch (e) {
      this.logger.error(e);
      console.trace(e);
      await page.close();
      throw e;
    }
  }

  async handleCrawlThumbUrl(page: Page, jobData: CrawlThumbImage) {
    const imageUploadedInfo =
      await this.crawlUploadService.crawlAndUploadImageToDriver(
        page,
        `cm-${jobData.comicId}`,
        jobData.imageUrls,
      );
    const newImage = await this.createImageDocument(
      imageUploadedInfo.fileUrl,
      0,
    );

    await this.updateComic(
      {
        thumbUrl: newImage,
      },
      jobData.comicId,
    );

    return {
      id: newImage.id,
    };
  }

  async handleUploadChapterImage(page: Page, jobData: CrawlChapterImages) {
    const rs: {
      id: string;
    }[] = [];
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

      rs.push({
        id: newImage.id,
      });
    }
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

  async updateComic(pushModel: Record<string, any>, comicId: string) {
    try {
      return await this.chapterService.findByIdAndUpdate(
        { _id: comicId },
        { $set: pushModel },
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

      if (url.includes('clobberprocurertightwad')) {
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
