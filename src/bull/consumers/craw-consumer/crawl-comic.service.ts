import { AuthorService } from '@crawl-engine/author/author.service';
import { CrawlProducerService } from '@crawl-engine/bull/producers/crawl-producer';
import { ComicChapterPre, CrawlRawData } from '@crawl-engine/bull/shared';
import { CrawlComicJobData, UpdateComicJobData } from '@crawl-engine/bull/shared/types';
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
import mongoose from 'mongoose';

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
  ) { }

  async handleCrawlJob(job: Job<CrawlComicJobData>) {
    const page = await this.browser.newPage();
    try {
      await this.preparePage(page, job.data.href)
      const rawData = await this.extractInfoFromComicPage(page);
      await page.evaluate('document.write()');

      const comic: Comic = new Comic();

      comic.originUrl = job.data.href;

      if (rawData.name) {
        comic.name = rawData.name;
      }

      if (rawData.totalChapter) {
        comic.chapterCount = +rawData.totalChapter;
      }

      if (rawData.author) {
        await this.updateComicAuthor(comic, rawData.author)
      }

      if (rawData.tags) {
        await this.updateComicTags(comic, rawData.tags)
      }

      if (rawData.status) {
        await this.updateComicStatus(comic, rawData.status)
      }

      comic.chapters = [];

      if (rawData.thumbUrl) {
        await this.updateThumbImageComic(comic, page, rawData.thumbUrl, job.data.href)
      }

      this.logger.log('Process create new comic');
      const createdComic = await this.comicService.createOne(comic);
      await this.addJobCrawlChapters(rawData.chapters, createdComic.id);

    } catch (e) {
      this.logger.error('Crawl Comic failed >>');
      this.logger.error(e);
    } finally {
      setTimeout(async () => {
        await page.close()
      }, 30000)
    }
  }

  async preparePage(page: Page, goto: string) {
    await page.setJavaScriptEnabled(false);

    await page.setRequestInterception(true);

    await this.abortRequest(page, [goto]);

    await page.goto(goto, {
      waitUntil: 'domcontentloaded',
      timeout: 0,
    });

    page.off('request');
    await page.setRequestInterception(false);
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
      )
      chapters.sort((a, b) => +a.chapNumber - +b.chapNumber )

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
      if (ignoreUrls.includes(url)) {
        request.continue();
        return;
      }
      request.abort('internetdisconnected');
    });
  }

  /**
   * @description Refresh or update existed comic value
   * @param job job from bullmq
   */
  public async handleUpdateComic(job: Job<UpdateComicJobData>) {
    this.logger.log(`[${this.handleUpdateComic.name}]::= Update comic`)
    const comic = await this.comicService.model.findOne({
      _id: new mongoose.Types.ObjectId(job.data.comicId)
    }).exec()

    if (!comic) {
      throw new Error("Dont exist comicId: " + job.data.comicId)
    }

    const page = await this.browser.newPage();

    try {
      if (job.data.newUrl) {
        comic.originUrl = job.data.newUrl;
      }

      await this.preparePage(page, comic.originUrl as string)

      const rawData = await this.extractInfoFromComicPage(page);
      const lastedChapter = comic.chapterCount;
      this.logger.log(`[${this.handleUpdateComic.name}]::= Found comic and update what it changed`)

      await page.evaluate('document.write()');

      if (rawData.name != comic.name) {
        comic.name = rawData.name;
      }

      if (rawData.status != comic.status.name) {
        await this.updateComicStatus(comic, rawData.status)
      }

      if (rawData.totalChapter) {
        comic.chapterCount = +rawData.totalChapter;
      }

      if (rawData.author != comic.author.name) {
        await this.updateComicAuthor(comic, rawData.author)
      }

      if (rawData.tags) {
        await this.updateComicTags(comic, rawData.tags)
      }

      if (rawData.totalChapter > lastedChapter) {
        await this.addJobCrawlChapters(rawData.chapters.filter((_, i) => i > lastedChapter), comic.id)
      }

      await comic.save()

    } catch (e) {
      this.logger.error(`[${this.handleUpdateComic.name}]::= Fail`)
      this.logger.error(e)

    } finally {
      setTimeout(async () => {
        await page.close()
      }, 30000);
    }

  }

  private addJobCrawlChapters(chapters: ComicChapterPre[], comicId: string) {
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


  private async updateComicStatus(comic: Comic, status: string) {
    this.logger.log(`[${this.updateComicStatus.name}]:= Process comic status `);
    const statusDoc = await this.statusService.findOrCreate(
      { name: status },
      {},
    );
    comic.status = {
      name: status,
      id: statusDoc.id,
    };
  }

  private async updateComicTags(comic: Comic, tags: string[]) {
    this.logger.log(`[${this.updateComicStatus.name}]:= Process comic tags `);
    comic.tags = [];
    for (const tag of tags) {
      const tagDoc = await this.tagService.findOrCreate({ name: tag }, {});
      comic.tags.push({
        name: tag,
        id: tagDoc.id,
      });
    }
  }


  private async updateComicAuthor(comic: Comic, author: string) {
    this.logger.log(`[${this.updateComicStatus.name}]:= Process comic author `);
    const auth = await this.authorService.findOrCreate(
      { name: author },
      {},
    );
    comic.author = {
      name: auth.name.toString(),
      id: auth.id,
    };
  }

  private async updateThumbImageComic(comic: Comic, page: Page, thumbUrl: string, goto: string) {
    comic.thumbUrl = null;
    this.logger.log('Process crawl image thumb url');
    comic.thumbUrl = await this.crawlImageService.handleCrawlThumbUrl(
      page,
      {
        imageUrls: [thumbUrl],
        goto,
      },
    );
  }
}
