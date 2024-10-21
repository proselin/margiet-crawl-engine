import { AuthorService } from '@/entities/author/author.service';
import { CrawlProducerService } from '@/jobs/bullmq/producers/crawl-producer';
import { RawCrawledChapter, RawCrawledComic } from '@/jobs/bullmq/shared';
import {
  CrawlComicJobData,
  UpdateComicJobData,
} from '@/jobs/bullmq/shared/types';
import { Comic } from '@/entities/comic/comic.schema';
import { ComicService } from '@/entities/comic/comic.service';
import { InvalidComicInformation } from '@/exception';
import { TagService } from '@/entities/tag/tag.service';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { CrawlImageService } from '@/jobs/bullmq/consumers/craw-consumer/services/crawl-image.service';
import mongoose from 'mongoose';
import { UpdateComicResultModel } from '@/models/jobs/consumer/update-comic-result.model';
import { CrawlComicResultModel } from '@/models/jobs/consumer/crawl-comic-result.model';
import { ImageDocument, ImageService } from '@/entities/image';

@Injectable()
export class CrawlComicService {
  private logger = new Logger(CrawlComicService.name);

  constructor(
    private readonly authorService: AuthorService,
    private readonly comicService: ComicService,
    private readonly tagService: TagService,
    private readonly crawlProducerService: CrawlProducerService,
    private readonly imageService: ImageService,
    @InjectBrowser() private browser: Browser,
    private crawlImageService: CrawlImageService,
  ) {}

  async handleCrawlJob(job: Job<CrawlComicJobData>) {
    const page = await this.browser.newPage();
    try {
      await this.preparePage(page, job.data.href);
      const crawledComic = await this.extractInfoFromComicPage(page);
      await page.evaluate('document.write()');
      const comic: Comic = new this.comicService.Model();
      comic.chapters = [];
      comic.url_history = [job.data.href];
      comic.is_current_url_is_notfound = false;

      comic.origin_url = job.data.href;
      await job.updateProgress(10);
      if (crawledComic.title) {
        comic.title = crawledComic.title;
      }

      if (crawledComic.totalChapter) {
        comic.chapter_count = +crawledComic.totalChapter;
        await job.updateProgress(15);
      }

      if (crawledComic.author) {
        await this.handleComicAuthor(comic, crawledComic.author);
        await job.updateProgress(20);
      }

      if (crawledComic.tags) {
        await this.handleComicTags(comic, crawledComic.tags);
        await job.updateProgress(25);
      }

      if (crawledComic.status) {
        comic.status = crawledComic.status;
        await job.updateProgress(35);
      }
      let thumbImage: ImageDocument | null = null;
      if (crawledComic.thumbUrl) {
        thumbImage = await this.updateThumbImageComic(
          comic,
          page,
          crawledComic.thumbUrl,
          job.data.href,
        );
        await job.updateProgress(55);
      }

      this.logger.log('Process create new comic-fe');
      await job.updateProgress(75);
      const createdComic = await this.comicService.createOne(comic);

      //Link Comic And  Thumb Image
      if (thumbImage) {
        thumbImage.comicId = createdComic._id.toString();
        await thumbImage.save();
      }

      return {
        chapters: crawledComic.chapters ?? [],
        comic: createdComic,
        thumbImage,
      } as CrawlComicResultModel;
    } catch (e) {
      this.logger.error('Crawl Comic failed >>');
      this.logger.error(e);
    } finally {
      await page.close();
      await job.updateProgress(100);
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
      title: '',
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
      crawResult.title = await page.$eval('h1.title-detail', (ele) => {
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
      crawResult.totalChapter = crawResult.chapters.length;
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
   * @param job jobs from bullmq
   */
  public async handleUpdateComic(job: Job<UpdateComicJobData>) {
    this.logger.log(`[${this.handleUpdateComic.name}]::= Update comic`);
    const comic = await this.comicService.Model.findOne({
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

      if (rawData.title != comic.title) {
        comic.title = rawData.title;
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

      let updateChapters = [];
      if (rawData.totalChapter > lastedChapter) {
        updateChapters = rawData.chapters.filter((_, i) => i > lastedChapter);
      }
      comic.should_refresh = !!refresh;
      await comic.save();

      return {
        comic: comic,
        updateChapters: updateChapters,
      } as UpdateComicResultModel;
    } catch (e) {
      this.logger.error(`[${this.handleUpdateComic.name}]::= Fail`);
      this.logger.error(e);
    } finally {
      await page.close();
    }
    await job.updateProgress(100);
  }

  addJobCrawlChapters(chapters: RawCrawledChapter[], comicId: string) {
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
      const tagDoc = await this.tagService.Model.findOneAndUpdate(
        {
          title: tagName,
        },
        {
          $set: {
            title: tagName,
          },
        },
        {
          upsert: true,
        },
      ).exec();
      comic.tags.push(tagDoc);
    }
  }

  private async handleComicAuthor(comic: Comic, authorName: string) {
    this.logger.log(`[${this.handleComicAuthor.name}]:= Process comic author `);
    comic.author = await this.authorService.Model.findOneAndUpdate(
      { title: authorName },
      {
        $set: {
          title: authorName,
        },
      },
      {
        upsert: true,
      },
    ).exec();
  }

  private async updateThumbImageComic(
    comic: Comic,
    page: Page,
    thumbUrl: string,
    goto: string,
  ): Promise<ImageDocument> {
    comic.thumb_image = null;
    this.logger.log('Process crawl image-fe thumb url');
    const thumb = await this.crawlImageService.handleCrawlThumbUrl(page, {
      imageUrls: [thumbUrl],
      goto,
    });
    comic.thumb_image = thumb;
    return thumb;
  }
}
