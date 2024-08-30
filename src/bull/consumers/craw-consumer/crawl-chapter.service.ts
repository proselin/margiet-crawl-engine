import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CrawlChapterData } from '@crawl-engine/bull/shared/types';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { Chapter } from '@crawl-engine/chapter/chapter.schema';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { ComicService } from '@crawl-engine/comic/comic.service';
import { CrawlImageService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-image.service';

@Injectable()
export class CrawlChapterService {
  private readonly logger = new Logger(CrawlChapterService.name);

  constructor(
    private chapterService: ChapterService,
    private comicService: ComicService,
    @InjectBrowser()
    private readonly browser: Browser,
    private readonly crawlImageService: CrawlImageService,
  ) {}

  async handleCrawlJob(job: Job<CrawlChapterData>) {
    const page = await this.browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    await this.abortRequest(page, [job.data.url]);
    try {
      await page.goto(job.data.url, {
        waitUntil: 'domcontentloaded',
        timeout: 0,
      });

      page.off('request');
      await page.setRequestInterception(false);

      const imgServerUrls = await page.$$eval('.page-chapter img', (imgs) =>
        imgs.map((img) => {
          return [img.dataset.sv1, img.dataset.sv2];
        }),
      );

      const createdChapter = await this.chapterService.createOne(
        this.mapDataToChapterDTO(
          job.data.url,
          job.data.dataId,
          job.data.chapNumber,
          job.data.position,
        ),
      );

      await this.comicService.findAndUpdate(
        {
          _id: job.data.comicId,
        },
        {
          $push: {
            chapters: {
              name: job.data.chapNumber,
              id: createdChapter.id,
              position: job.data.position,
            },
          },
        },
      );
      const rs = await this.crawlImageService.handleCrawlAndUploadChapterImage(
        page,
        {
          chapterId: createdChapter.id,
          goto: job.data.url,
          images: imgServerUrls.map((imageUrls, index) => {
            return {
              imageUrls,
              position: index,
            };
          }),
        },
      );
      return {
        chapterId: createdChapter.id,
        images: rs,
      };
    } catch (e) {
      this.logger.error(`Crawl job ${job.token} Fail :=`);
      this.logger.error(e);
    }
  }

  private async abortRequest(page: Page, ignoreUrls: string[]) {
    page.on('request', (request) => {
      const url = request.url();
      if (ignoreUrls.includes(url)) {
        request.continue();
        return;
      }
      request.abort('blockedbyclient');
    });
  }

  private mapDataToChapterDTO(
    sourceUrl: string,
    dataId: string,
    chapNumber: string,
    position: number,
  ) {
    const dto = new Chapter();
    dto.dataId = dataId;
    dto.images = [];
    dto.chapterNumber = chapNumber;
    dto.position = position;
    dto.name = 'Chapter ' + chapNumber;
    dto.sourceUrl = sourceUrl;
    return dto;
  }
}
