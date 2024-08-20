import { JobConstant } from '@crawl-engine/bull/shared';
import { CrawlImageData } from '@crawl-engine/bull/shared/types';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { Image as ImageDoc } from '@crawl-engine/image/image.schema';
import { ImageService } from '@crawl-engine/image/image.service';
import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectBrowser, InjectPage } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { CrawlUploadService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-upload.service';

@Injectable()
export class CrawlImageService implements BeforeApplicationShutdown {
  private logger = new Logger(CrawlImageService.name);

  constructor(
    private imageService: ImageService,
    private chapterService: ChapterService,
    private crawlUploadService: CrawlUploadService,
    @InjectPage(JobConstant.CRAWL_IMAGE_PAGE_NAME)
    private page: Page,
    @InjectBrowser()
    private browser: Browser,
  ) {}

  async handleCrawlJob(job: Job<CrawlImageData>) {
    try {
      this.logger.log(
        `Process crawl job image ${job.token} with ChapterUrl ${job.data.chapterUrl}`,
      );
      //Setup response listener
      if (!this.page || this.page?.isClosed()) {
        this.page = await this.browser.newPage();
      }
      await this.abortAllOutRequest(job.data.chapterUrl);
      await this.page.goto(job.data.chapterUrl, {
        timeout: 0,
        waitUntil: 'domcontentloaded',
      });
      const imgSvData = await this.page.$$eval('.page-chapter img', (imgs) =>
        imgs.map((img) => {
          return [img.dataset.sv1, img.dataset.sv2];
        }),
      );

      await this.page.evaluate('document.write("")');
      await this.page.setRequestInterception(false);
      this.page.off('request');

      const newImages: ImageDoc[] = [];
      for (let index = 0; index < imgSvData.length; index++) {
        const imageUploadedInfo =
          await this.crawlUploadService.crawlAndUploadImageToDriver(
            this.page,
            `c-${job.data.chapterId}-i-${index}`,
            imgSvData[index],
          );
        const newImage = await this.createImageDocument(
          imageUploadedInfo.fileUrl,
          index,
        );
        newImages.push(newImage);
      }

      await this.updateChapter(
        {
          images: newImages,
        },
        job.data.chapterId,
      );
      return {
        chapterId: job.data.chapterId,
        newImages,
      };
    } catch (e) {
      this.logger.error(e);
      console.trace(e);
      throw e;
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

  async beforeApplicationShutdown() {
    await this.browser.close();
  }

  private async abortAllOutRequest(originURl: string) {
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      const url = request.url();
      if (url == originURl) request.continue();
      else request.abort('internetdisconnected');
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
