import { AuthorService } from '@/entities/author/author.service';
import { CrawlProducerService } from '@/jobs/bullmq/producers/crawl-producer';
import { RawCrawledChapter, RawCrawledComic } from '@/jobs/bullmq/shared';
import {
  CrawlComicJobData,
  UpdateComicJobData,
} from '@/jobs/bullmq/shared/types';
import { Comic } from '@/entities/comic/comic.schema';
import { ComicService } from '@/entities/comic/comic.service';
import { InvalidComicInformation } from '@/common';
import { TagService } from '@/entities/tag/tag.service';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { CrawlImageService } from '@/jobs/bullmq/consumers/craw-consumer/crawl-image.service';
import mongoose from 'mongoose';
import { SyncComicRmqProducer } from '@/jobs/rabbitmq/producer/sync-comic-rmq.producer';

@Injectable()
export class CrawlComicService {
  private logger = new Logger(CrawlComicService.name);

  constructor(
    private readonly authorService: AuthorService,
    private readonly comicService: ComicService,
    private readonly tagService: TagService,
    private readonly crawlProducerService: CrawlProducerService,
    @InjectBrowser() private browser: Browser,
    private crawlImageService: CrawlImageService,
    private rmqProducer: SyncComicRmqProducer,
  ) {}

  async handleCrawlJob(job: Job<CrawlComicJobData>) {
    const page = await this.browser.newPage();
    try {
      await this.preparePage(page, job.data.href);
      const crawledComic = await this.extractInfoFromComicPage(page);
      await page.evaluate('document.write()');

      const comic: Comic = new Comic();

      comic.chapters = [];
      comic.url_history = [job.data.href];
      comic.is_current_url_is_notfound = false;

      comic.origin_url = job.data.href;

      if (crawledComic.name) {
        comic.title = crawledComic.name;
      }

      if (crawledComic.totalChapter) {
        comic.chapter_count = +crawledComic.totalChapter;
      }

      if (crawledComic.author) {
        await this.handleComicAuthor(comic, crawledComic.author);
      }

      if (crawledComic.tags) {
        await this.handleComicTags(comic, crawledComic.tags);
      }

      if (crawledComic.status) {
        comic.status = crawledComic.status;
      }

      if (crawledComic.thumbUrl) {
        await this.updateThumbImageComic(
          comic,
          page,
          crawledComic.thumbUrl,
          job.data.href,
        );
      }

      this.logger.log('Process create new comic-fe');
      const createdComic = await this.comicService.createOne(comic);
      await this.addJobCrawlChapters(crawledComic.chapters, createdComic.id);
      await this.rmqProducer.pushMessageSyncComic(createdComic);
    } catch (e) {
      this.logger.error('Crawl Comic failed >>');
      this.logger.error(e);
    } finally {
      setTimeout(async () => {
        await page.close();
      }, 2000);
    }
  }

  async preparePage(page: Page, goto: string) {
    await page.setJavaScriptEnabled(false);
    await page.setCacheEnabled(false);

    await page.setRequestInterception(true);

    await this.abortRequest(page, [goto]);

    await page.goto(goto, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    page.off('request');
    await page.setRequestInterception(false);
  }

  async extractInfoFromComicPage(page: Page): Promise<RawCrawledComic> {
    const crawResult: RawCrawledComic = {
      author: '',
      name: '',
      status: '',
      totalChapter: 0,
      tags: [],
      thumbUrl: '',
      chapters: [],
    };

    try {
      crawResult.thumbUrl = await page
        .$eval('img.image-thumb', (ele) => ele.src)
        .catch(() => 'empty');
      crawResult.author = await page.$eval('.status.row .col-xs-8', (ele) =>
        ele.textContent.trim(),
      );
      crawResult.status = await page.$eval('.status.row .col-xs-8', (ele) =>
        ele.textContent.trim(),
      );
      crawResult.tags = await page.$$eval('.kind.row .col-xs-8 a', (eles) =>
        eles.map((ele) => ele.textContent.trim()),
      );
      crawResult.name = await page.$eval('h1.title-detail', (ele) => {
        return ele.textContent.trim();
      });
      crawResult.chapters = await page.$$eval(
        '#desc > li > .chapter > a',
        (eles) =>
          eles.map((ele) => {
            return {
              dataId: ele.dataset.id,
              url: ele.href,
              chapNumber: ele.textContent.match(/([\d.]+)/g)[0],
            } as RawCrawledChapter;
          }),
      );
      crawResult.chapters.sort((a, b) => +a.chapNumber - +b.chapNumber);
    } catch (e) {
      throw new InvalidComicInformation();
    }
    return crawResult;
  }

  private async abortRequest(page: Page, ignoreUrls: string[]) {
    page.on('request', (request) => {
      const url = request.url();
      if (ignoreUrls.includes(url)) {
        request.continue();
        return;
      }
      request.abort('internetdisconnected');
    });
  }

  /**
   * @description Refresh or update existed comic-fe value
   * @param job job from bullmq
   */
  public async handleUpdateComic(job: Job<UpdateComicJobData>) {
    this.logger.log(`[${this.handleUpdateComic.name}]::= Update comic`);
    const comic = await this.comicService.model
      .findOne({
        _id: new mongoose.Types.ObjectId(job.data.comicId),
      })
      .populate('author')
      .populate('tags')
      .populate('chapters')
      .exec();

    if (!comic) {
      throw new Error('Dont exist comicId: ' + job.data.comicId);
    }

    const page = await this.browser.newPage();

    try {
      if (job.data.newUrl) {
        comic.origin_url = job.data.newUrl;
      }

      await this.preparePage(page, comic.origin_url as string);

      const rawData = await this.extractInfoFromComicPage(page);
      const lastedChapter = comic.chapter_count;
      this.logger.log(
        `[${this.handleUpdateComic.name}]::= Found comic and update what it changed`,
      );

      await page.evaluate('document.write()');

      let refresh: 1 | 0 = 0;

      if (rawData.name != comic.title) {
        comic.title = rawData.name;
        refresh = 1;
      }

      if (rawData.status != comic.status) {
        comic.status = rawData.status;
        refresh = 1;
      }

      if (rawData.totalChapter) {
        comic.chapter_count = +rawData.totalChapter;
        refresh = 1;
      }

      if (rawData.author != comic.author.title) {
        await this.handleComicAuthor(comic, rawData.author);
        refresh = 1;
      }

      if (rawData.tags) {
        await this.handleComicTags(comic, rawData.tags);
        refresh = 1;
      }

      if (rawData.totalChapter > lastedChapter) {
        await this.addJobCrawlChapters(
          rawData.chapters.filter((_, i) => i > lastedChapter),
          comic.id,
        );
      }
      comic.should_refresh = !!refresh;
      await this.rmqProducer.pushMessageSyncComic(await comic.save());
    } catch (e) {
      this.logger.error(`[${this.handleUpdateComic.name}]::= Fail`);
      this.logger.error(e);
    } finally {
      await page.close();
    }
  }

  private addJobCrawlChapters(chapters: RawCrawledChapter[], comicId: string) {
    return this.crawlProducerService.addCrawlChapterJobs(
      chapters.map((chapter, index) => {
        return {
          url: chapter.url,
          chapNumber: chapter.chapNumber,
          dataId: chapter.dataId,
          comicId,
          position: index,
        };
      }),
    );
  }

  private async handleComicTags(comic: Comic, tags: string[]) {
    this.logger.log(`[${this.handleComicTags.name}]:= Process comic tags `);
    comic.tags = [];
    for (const tagName of tags) {
      const tagDoc = await this.tagService.findOrCreate({ name: tagName }, {});
      comic.tags.push(tagDoc);
    }
  }

  private async handleComicAuthor(comic: Comic, authorName: string) {
    this.logger.log(`[${this.handleComicAuthor.name}]:= Process comic author `);
    comic.author = await this.authorService.findOrCreate(
      { name: authorName },
      {},
    );
  }

  private async updateThumbImageComic(
    comic: Comic,
    page: Page,
    thumbUrl: string,
    goto: string,
  ) {
    comic.thumb_image = null;
    this.logger.log('Process crawl image-fe thumb url');
    comic.thumb_image = await this.crawlImageService.handleCrawlThumbUrl(page, {
      imageUrls: [thumbUrl],
      goto,
    });
  }
}
