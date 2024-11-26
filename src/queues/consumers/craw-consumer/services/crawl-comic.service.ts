import { CrawlProducerService } from '@/queues/producers/crawl-producer';
import { ComicEntity } from '@/entities/comic/comic.entity';
import { InvalidComicInformation } from '@/exception';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { CrawlImageService } from '@/queues/consumers/craw-consumer/services/crawl-image.service';
import { CrawlComicResultModel } from '@/models/jobs/consumer/crawl-comic-result.model';
import { And, DataSource, In, Not, Repository } from 'typeorm';
import { TagEntity } from '@/entities/tag';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CrawlComicJobData,
  RawCrawledChapter,
  RawCrawledComic,
  UpdateComicJobData,
} from '@/common';
import { ImageEntity } from '@/entities/image';
import { AuthorEntity } from '@/entities/author';
import { UpdateComicResultModel } from '@/models/jobs/consumer/update-comic-result.model';

@Injectable()
export class CrawlComicService {
  private logger = new Logger(CrawlComicService.name);

  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private readonly crawlProducerService: CrawlProducerService,
    @InjectBrowser() private browser: Browser,
    private crawlImageService: CrawlImageService,
    private dataSource: DataSource,
  ) {}

  async crawlComicInformation(job: Job<CrawlComicJobData>) {
    const page = await this.browser.newPage();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.preparePage(page, job.data.href);
      const crawledInformation = await this.extractInfoFromComicPage(page);
      await page.evaluate('document.write()');

      const comic: ComicEntity = new ComicEntity();
      comic.urlHistory = [job.data.href];
      comic.originUrl = job.data.href;

      await job.updateProgress(10);
      if (crawledInformation.title) {
        comic.title = crawledInformation.title;
      }

      if (crawledInformation.totalChapter) {
        comic.chapterCount = +crawledInformation.totalChapter;
        await job.updateProgress(15);
      }

      if (crawledInformation.author) {
        const author = new AuthorEntity();
        author.title = crawledInformation.author.trim();
        await queryRunner.manager.save<AuthorEntity>(author);
        comic.author = Promise.resolve(author);
        await job.updateProgress(20);
      }

      if (crawledInformation.tags && crawledInformation.tags.length > 0) {
        if (!Array.isArray(await comic.tags) || !(await comic.tags).length) {
          comic.tags = Promise.resolve([]);
        }
        for (const tagName of crawledInformation.tags) {
          const tag = new TagEntity();
          tag.title = tagName;
          await queryRunner.manager.save(tag);
          (await comic.tags).push(tag);
        }
        await job.updateProgress(25);
      }

      if (crawledInformation.status) {
        comic.status = crawledInformation.status;
        await job.updateProgress(35);
      }

      if (crawledInformation.thumbUrl) {
        comic.thumbImage = Promise.resolve(
          this.updateThumbImageComic(
            comic,
            page,
            crawledInformation.thumbUrl,
            job.data.href,
          ),
        );
        await comic.thumbImage;
        await job.updateProgress(55);
      }

      this.logger.log('Process create new comic-fe');
      await job.updateProgress(75);
      await queryRunner.manager.save(comic);
      await queryRunner.commitTransaction();

      return {
        chapters: crawledInformation.chapters ?? [],
        comic,
      } satisfies CrawlComicResultModel;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Crawl Comic failed >>');
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
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
            } satisfies RawCrawledChapter;
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
   * @param job queues from bullmq
   */
  public async updateComicCrawled(job: Job<UpdateComicJobData>) {
    this.logger.log(`[${this.updateComicCrawled.name}]::= Update comic`);
    const comic = await this.comicRepository.findOne({
      where: {
        id: job.data.comicId,
      },
      relations: ['author', 'tag'],
    });

    if (!comic) {
      throw new Error('Dont exist comicId: ' + job.data.comicId);
    }

    const page = await this.browser.newPage();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (job.data.newUrl) {
        comic.originUrl = job.data.newUrl;
      }

      await this.preparePage(page, comic.originUrl as string);

      const rawData = await this.extractInfoFromComicPage(page);
      const lastedChapter = comic.chapterCount;
      this.logger.log(
        `[${this.updateComicCrawled.name}]::= Found comic and update what it changed`,
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
        comic.chapterCount = +rawData.totalChapter;
        refresh = 1;
      }

      if (rawData.author != (await comic.author).title) {
        const author = await comic.author;
        author.title = rawData.author;
        await queryRunner.manager.update(
          AuthorEntity,
          { id: author.id },
          author,
        );
        refresh = 1;
      }

      if (rawData.tags) {
        const notExistTags = await this.tagRepository.findBy({
          title: And(In(rawData.tags), Not(In(await comic.tags))),
        });
        const notExistTitles = notExistTags.map((entity) => entity.title);
        const newTags = await Promise.all(
          rawData.tags
            .filter((tagName) => !notExistTitles.includes(tagName))
            .map(async (tagName) => {
              const tag = new TagEntity();
              tag.title = tagName;
              await queryRunner.manager.save(tag);
              return tag;
            }),
        );
        (await comic.tags).push(...newTags);
        refresh = 1;
      }

      let updateChapters = [];
      if (rawData.totalChapter > lastedChapter) {
        updateChapters = rawData.chapters.filter((_, i) => i > lastedChapter);
      }
      comic.shouldRefresh = !!refresh;
      await queryRunner.manager.save(comic);
      await queryRunner.commitTransaction();
      return {
        comic: comic,
        updateChapters: updateChapters,
      } as UpdateComicResultModel;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`[${this.updateComicCrawled.name}]::= Fail`);
      this.logger.error(e);
    } finally {
      await queryRunner.release();
      await page.close();
    }
    await job.updateProgress(100);
  }

  createJobCrawlForChapter(chapters: RawCrawledChapter[], comicId: number) {
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

  private async updateThumbImageComic(
    comic: ComicEntity,
    page: Page,
    thumbUrl: string,
    goto: string,
  ): Promise<ImageEntity> {
    comic.thumbImage = null;
    this.logger.log('Process crawl image-fe thumb url');
    return this.crawlImageService.handleCrawlThumbUrl(page, {
      imageUrls: [thumbUrl],
      goto,
    });
  }
}
