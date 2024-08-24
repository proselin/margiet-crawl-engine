import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CrawlChapterData } from '@crawl-engine/bull/shared/types';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { Chapter } from '@crawl-engine/chapter/chapter.schema';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { CrawlProducerService } from '@crawl-engine/bull/producers/crawl-producer';
import { ComicService } from '@crawl-engine/comic/comic.service';

@Injectable()
export class CrawlChapterService {
  private readonly logger = new Logger(CrawlChapterService.name);

  constructor(
    private chapterService: ChapterService,
    private crawlProducerService: CrawlProducerService,
    private comicService: ComicService,
    @InjectBrowser()
    private readonly browser: Browser,
  ) {}

  async handleCrawlJob(job: Job<CrawlChapterData>) {
    const page = await this.browser.newPage();
    await page.setJavaScriptEnabled(false);
    await this.abortRequest(page, [job.data.url]);
    try {
      await page.goto(job.data.url, {
        waitUntil: 'domcontentloaded',
        timeout: 0,
      });

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

      await this.crawlProducerService.addCrawlImageJobs(
        imgServerUrls.map((imageUrls, index) => {
          return {
            isCrawlThumb: false,
            imageUrls,
            chapterId: createdChapter.id,
            goto: job.data.url,
            position: index,
          };
        }),
      );
      return createdChapter.id;
    } catch (e) {
    } finally {
      await page.close();
    }
  }

  private async abortRequest(page: Page, ignoreUrls: string[]) {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (
        ignoreUrls.includes(url) ||
        (request.resourceType() == 'image' &&
          (url.endsWith('.png') || url.endsWith('.jpg')))
      ) {
        request.continue();
        return;
      }
      request.abort('internetdisconnected');
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
