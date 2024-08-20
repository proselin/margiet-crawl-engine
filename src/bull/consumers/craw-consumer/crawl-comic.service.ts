import { AuthorService } from '@crawl-engine/author/author.service';
import { CrawlProducerService } from '@crawl-engine/bull/producers/crawl-producer';
import { ComicChapterPre, CrawlRawData } from '@crawl-engine/bull/shared';
import {
  CrawlComicJobData,
  CrawlImageData,
} from '@crawl-engine/bull/shared/types';
import { Chapter } from '@crawl-engine/chapter/chapter.schema';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { Comic } from '@crawl-engine/comic/comic.schema';
import { ComicService } from '@crawl-engine/comic/comic.service';
import { InvalidComicInformation } from '@crawl-engine/common';
import { StatusService } from '@crawl-engine/status/status.service';
import { TagService } from '@crawl-engine/tag/tag.service';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { CrawlUploadService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-upload.service';
import { v1 } from 'uuid';

@Injectable()
export class CrawlComicService {
  private logger = new Logger(CrawlComicService.name);

  constructor(
    private readonly chapterService: ChapterService,
    private readonly authorService: AuthorService,
    private readonly comicService: ComicService,
    private readonly statusService: StatusService,
    private readonly tagService: TagService,
    private readonly crawlProducerService: CrawlProducerService,
    private readonly uploadService: CrawlUploadService,
    @InjectBrowser()
    private browser: Browser,
  ) {}

  async handleCrawlJob(job: Job<CrawlComicJobData>) {
    try {
      const page = await this.browser.newPage();
      await this.abortAllOutRequest(page, job.data.href);
      await page.goto(job.data.href, {
        waitUntil: 'domcontentloaded',
        timeout: 0,
      });
      const rawData = await this.extractInfoFromComicPage(page);
      await page.evaluate('document.write()');
      const comic: Comic = new Comic();
      if (rawData.name) {
        comic.name = rawData.name;
      }

      if (rawData.totalChapter) {
        comic.chapterCount = +rawData.totalChapter;
      }

      if (rawData.author) {
        this.logger.log('Process author >>');
        const auth = await this.authorService.findAndCreate(
          { name: rawData.author },
          {},
        );
        comic.author = {
          name: auth.name.toString(),
          id: auth.id,
        };
      }

      if (rawData.tags) {
        this.logger.log('Process tags >>');
        comic.tags = [];
        for (const tag of rawData.tags) {
          const tagDoc = await this.tagService.findAndCreate({ name: tag }, {});
          comic.tags.push({
            name: tag,
            id: tagDoc.id,
          });
        }
      }

      if (rawData.status) {
        this.logger.log('Process status >>');
        const statusDoc = await this.statusService.findAndCreate(
          { name: rawData.status },
          {},
        );
        comic.status = {
          name: rawData.status,
          id: statusDoc.id,
        };
      }

      const crawlImageData: CrawlImageData[] = [];
      if (rawData.chapters) {
        comic.chapters = [];
        this.logger.log('Process chapters >>');
        for (const chapter of rawData.chapters) {
          const chapterDocument = new Chapter();
          chapterDocument.dataId = chapter.dataId;
          chapterDocument.images = [];
          chapterDocument.chapterNumber = chapter.chapNumber;

          const newChapter =
            await this.chapterService.createOne(chapterDocument);

          comic.chapters.push({
            name: chapter.chapNumber,
            id: newChapter.id,
          });

          crawlImageData.push({
            chapterId: newChapter.id,
            chapterUrl: chapter.url,
          });
        }
      }

      if (rawData.thumbUrl) {
        comic.thumbUrl = await this.getThumbImage(page, rawData.thumbUrl);
      }

      await this.comicService.createOne(comic);
      await this.crawlProducerService.addCrawlImageJobs(crawlImageData);
    } catch (e) {
      this.logger.error('Crawl Comic failed >>');
      this.logger.error(e);
    }
  }

  async extractInfoFromComicPage(page: Page): Promise<CrawlRawData> {
    let crawResult: CrawlRawData;

    try {
      const author = await page.$eval('.status.row .col-xs-8', (ele) =>
        ele.textContent.trim(),
      );
      const status = await page.$eval('.status.row .col-xs-8', (ele) =>
        ele.textContent.trim(),
      );
      const tags = await page.$$eval('.kind.row .col-xs-8 a', (eles) =>
        eles.map((ele) => ele.textContent.trim()),
      );
      const title = await page.$eval('h1.title-detail', (ele) => {
        return ele.textContent.trim();
      });
      const chapters: ComicChapterPre[] = await page.$$eval(
        '.col-xs-5.chapter a',
        (eles) =>
          eles.map((ele) => {
            return {
              dataId: ele.dataset.id,
              url: ele.href,
              chapNumber: ele.textContent.match(/([\d.]+)/g)[0],
            };
          }),
      );

      const thumbUrl = await page.$eval('img.image-thumb', (ele) => {
        return ele.src;
      });
      crawResult = {
        author,
        status,
        name: title,
        tags,
        totalChapter: chapters.length,
        chapters,
        thumbUrl,
      };
    } catch (e) {
      throw new InvalidComicInformation();
    }

    return crawResult;
  }

  async getThumbImage(page: Page, thumbUrl: string) {
    return this.uploadService
      .crawlAndUploadImageToDriver(page, `thumb-${v1()}`, [thumbUrl])
      .then((res) => {
        return res.fileUrl;
      });
  }

  private async abortAllOutRequest(page: Page, originURl: string) {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (url == originURl) request.continue();
      else request.abort('internetdisconnected');
    });
  }
}
