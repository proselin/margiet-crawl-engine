import { AuthorService } from '@crawl-engine/author/author.service';
import { CrawlProducerService } from '@crawl-engine/bull/producers/crawl-producer';
import { ComicChapterPre, CrawlRawData } from '@crawl-engine/bull/shared';
import { CrawlComicJobData } from '@crawl-engine/bull/shared/types';
import { Comic } from '@crawl-engine/comic/comic.schema';
import { ComicService } from '@crawl-engine/comic/comic.service';
import { InvalidComicInformation } from '@crawl-engine/common';
import { StatusService } from '@crawl-engine/status/status.service';
import { TagService } from '@crawl-engine/tag/tag.service';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { CrawlImageService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-image.service';

@Injectable()
export class CrawlComicService {
  private logger = new Logger(CrawlComicService.name);

  constructor(
    private readonly authorService: AuthorService,
    private readonly comicService: ComicService,
    private readonly statusService: StatusService,
    private readonly tagService: TagService,
    private readonly crawlProducerService: CrawlProducerService,
    @InjectBrowser()
    private browser: Browser,
    private crawlImageService: CrawlImageService,
  ) {}

  async handleCrawlJob(job: Job<CrawlComicJobData>) {
    const page = await this.browser.newPage();
    try {
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      await this.abortRequest(page, [job.data.href]);
      await page.goto(job.data.href, {
        waitUntil: 'domcontentloaded',
        timeout: 0,
      });
      page.off('request');
      await page.setRequestInterception(false);
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

      comic.chapters = [];
      comic.thumbUrl = null;

      this.logger.log('Process create new comic >>');
      const createdComic = await this.comicService.createOne(comic);

      if (rawData.thumbUrl) {
        await this.crawlImageService.handleCrawlThumbUrl(page, {
          imageUrls: [rawData.thumbUrl],
          comicId: createdComic.id,
          goto: job.data.href,
        });
      }

      await this.crawlProducerService.addCrawlChapterJobs(
        rawData.chapters.map((chapter, index) => {
          return {
            url: chapter.url,
            chapNumber: chapter.chapNumber,
            dataId: chapter.dataId,
            comicId: createdComic.id,
            position: index,
          };
        }),
      );
      await page.close();
    } catch (e) {
      this.logger.error('Crawl Comic failed >>');
      this.logger.error(e);
      await page.close();
    }
  }

  async extractInfoFromComicPage(page: Page): Promise<CrawlRawData> {
    let crawResult: CrawlRawData;

    try {
      const thumbUrl = await page.$eval(
        '.detail-info .col-image > img.image-thumb',
        (ele) => ele.src,
      );
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
        '#desc > li > .chapter > a',
        (eles) =>
          eles.map((ele) => {
            return {
              dataId: ele.dataset.id,
              url: ele.href,
              chapNumber: ele.textContent.match(/([\d.]+)/g)[0],
            };
          }),
      );

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

  private async abortRequest(page: Page, ignoreUrls: string[]) {
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
}
