import { AuthorService } from '@crawl-engine/author/author.service';
import { CrawlProducerService } from '@crawl-engine/bull/producers/crawl-producer';
import { CrawlRawData } from '@crawl-engine/bull/shared';
import {
  CrawlChapterData,
  CrawlComicJobData,
} from '@crawl-engine/bull/shared/types';
import { Chapter } from '@crawl-engine/chapter/chapter.schema';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { Comic } from '@crawl-engine/comic/comic.schema';
import { ComicService } from '@crawl-engine/comic/comic.service';
import { InvalidComicInformation } from '@crawl-engine/common';
import { StatusService } from '@crawl-engine/status/status.service';
import { TagService } from '@crawl-engine/tag/tag.service';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Job } from 'bullmq';

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
  ) {}

  async handleCrawlJob(job: Job<CrawlComicJobData>) {
    try {
      const rawData = await this.extractInfoFromComicPage(job.data.href);
      const comic: Comic = new Comic();
      if (rawData.name) {
        comic.name = rawData.name;
      }

      if (rawData.totalChapter) {
        comic.chapterCount = +rawData.totalChapter;
      }

      if (rawData.author) {
        this.logger.debug('Process author >>');
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
        this.logger.debug('Process tags >>');
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
        this.logger.debug('Process status >>');
        const statusDoc = await this.statusService.findAndCreate(
          { name: rawData.status },
          {},
        );
        comic.status = {
          name: rawData.status,
          id: statusDoc.id,
        };
      }

      const crawlChapterData: CrawlChapterData[] = [];
      if (rawData.chapters) {
        comic.chapters = [];
        this.logger.debug('Process chapters >>');
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

          crawlChapterData.push({
            dataId: chapter.dataId,
            chapterId: newChapter.id,
            chapterNumber: chapter.chapNumber,
            chapterURL: chapter.url,
          });
        }
      }

      await this.comicService.createOne(comic);
      await this.crawlProducerService.addCrawlChapterJobs(crawlChapterData);
    } catch (e) {
      this.logger.error('Crawl Comic failed >>');
      this.logger.error(e);
    }
  }

  async extractInfoFromComicPage(comicPath: string): Promise<CrawlRawData> {
    let crawResult: CrawlRawData;
    const res = await axios.get(comicPath);
    const htmlContent = res.data;

    if (!htmlContent) {
      throw new InvalidComicInformation();
    }

    try {
      const author = htmlContent
        .match(
          /(?<=<li class="author row">.+<p class="col-xs-8">).+?(?=<\/p>)/,
        )!
        .toString()
        .trim();
      const status = htmlContent
        .match(
          /(?<=<li class="status row">.+<p class="col-xs-8">).+?(?=<\/p>)/,
        )!
        .toString()
        .trim();
      const tags = Array.from(
        htmlContent
          .match(
            /(?<=<li class="kind row">.+<p class="col-xs-8">).+?(?=<\/p>)/,
          )!
          .toString()
          .matchAll(/<a[^>]*>(.*?)<\/a>/g),
        (m) => m[1],
      );
      const title = htmlContent.match(
        /(?<=<h1 class="title-detail">)(.+?)(?=<\/h1>)/,
      )![0];
      const chapterElement: string[] =
        htmlContent.match(
          /(?<=<div class="col-xs-5 chapter">).+?(?=<\/div>)/g,
        ) ?? [];

      crawResult = {
        author,
        status,
        name: title,
        tags,
        totalChapter: chapterElement.length,
        chapters: [],
      };

      Array.from(chapterElement).forEach((chapter) => {
        const href = chapter.match(/.(?<=href=".)(.*?)(?=")/)![0];
        const dataId = chapter.match(/(?<=data-id=")(.*?)(?=")/)![0];
        const chapterNumber = chapter.match(
          /(?<=<a.+?>.+)([\d.]+)(?=<\/a>)/,
        )![0];
        crawResult.chapters.push({
          dataId,
          chapNumber: chapterNumber,
          url: href,
        });
      });
    } catch (e) {
      throw new InvalidComicInformation();
    }

    return crawResult;
  }
}
