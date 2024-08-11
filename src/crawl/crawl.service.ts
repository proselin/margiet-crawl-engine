import { Inject, Injectable, Logger } from '@nestjs/common';
import { CrawlRawData } from '@crawl-engine/bull/shared';
import axios from 'axios';
import { InvalidComicInformation } from '@crawl-engine/common';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { AuthorService } from '@crawl-engine/author/author.service';
import { ComicService } from '@crawl-engine/comic/comic.service';
import { StatusService } from '@crawl-engine/status/status.service';
import { TagService } from '@crawl-engine/tag/tag.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Chapter, ChapterDocument } from '@crawl-engine/chapter/chapter.schema';
import { Comic } from '@crawl-engine/comic/comic.schema';
import * as assert from 'node:assert';
import { CrawlConsumerService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-consumer.service';
import { CrawlProducerService } from '@crawl-engine/bull/producers/crawl-producer';
import { CrawlChapterObject } from '@crawl-engine/bull/shared/types';

@Injectable()
export class CrawlService {
  private logger = new Logger(CrawlService.name);

  constructor(
    @InjectConnection() private connection: Connection,
    private readonly chapterService: ChapterService,
    private readonly authorService: AuthorService,
    private readonly comicService: ComicService,
    private readonly statusService: StatusService,
    private readonly tagService: TagService,
    private readonly crawlProducerService: CrawlProducerService,
  ) {}

  async handleCrawlEvent(href: string) {
    // const session = await this.connection.startSession();
    // session.startTransaction();
    try {
      const rawData = await this.extractInfoFromComicPage(href);
      const comic: Comic = new Comic()
      if(rawData.name) {
        comic.name = rawData.name;
      }

      if(rawData.totalChapter) {
        comic.chapterCount = +rawData.totalChapter
      }

      if (rawData.author) {
        this.logger.debug("Process author >>")
        const auth = await this.authorService.findAndCreate({name : rawData.author},{}, );
        comic.author = {
          name: auth.name.toString(),
          id: auth.id
        }
      }

      if(rawData.tags) {
        this.logger.debug("Process tags >>")
        comic.tags = []
        for (let tag of rawData.tags) {
           const tagDoc =  await this.tagService.findAndCreate({name: tag}, {})
           comic.tags.push({
             name: tag,
             id: tagDoc.id
           })
       }
      }

      if(rawData.status) {
        this.logger.debug("Process status >>")
        const statusDoc = await this.statusService.findAndCreate({name: rawData.status}, {},)
        comic.status = {
          name: rawData.status,
          id: statusDoc.id
        }
      }
      let chapterJobObjects: CrawlChapterObject[] = []
      if(rawData.chapters) {
        comic.chapters = []
        this.logger.debug("Process chapters >>")
        for (let chapter of rawData.chapters) {

          const chapterDocument = new Chapter()
          chapterDocument.chapterId = chapter.dataId;
          chapterDocument.images = []
          chapterDocument.chapterNumber = chapter.chapNumber

          const newChapter = await this.chapterService.createOne(chapterDocument)

          chapterJobObjects.push({
            chapterId: chapter.dataId,
            chapterNumber: chapter.chapNumber,
            chapterURL: chapter.url,
            docId: newChapter.id
          })
          comic.chapters.push({
            name: chapter.chapNumber,
            id: newChapter.id
          })
        }
      }

      await this.comicService.createOne(comic)
      await this.crawlProducerService.addCrawlChapterJob(chapterJobObjects)
    }catch (e) {
      this.logger.error("Crawl Comic failed >>");
      this.logger.error(e)
      // await session.abortTransaction();
    } finally {
      // await session.endSession()
    }

  }
  async extractInfoFromComicPage(comicPath: string): Promise<CrawlRawData> {
    let text = '';
    let crawResult: CrawlRawData;
    const res = await axios.get(comicPath);
    text = res.data;

    if (!text) {
      throw new InvalidComicInformation();
    }

    try {
      const author = text
        .match(
          /(?<=<li class="author row">.+<p class="col-xs-8">).+?(?=<\/p>)/,
        )!
        .toString()
        .trim();
      const status = text
        .match(
          /(?<=<li class="status row">.+<p class="col-xs-8">).+?(?=<\/p>)/,
        )!
        .toString()
        .trim();
      const tags = Array.from(
        text
          .match(
            /(?<=<li class="kind row">.+<p class="col-xs-8">).+?(?=<\/p>)/,
          )!
          .toString()
          .matchAll(/<a[^>]*>(.*?)<\/a>/g),
        (m) => m[1],
      );
      const title = text.match(
        /(?<=<h1 class="title-detail">)(.+?)(?=<\/h1>)/,
      )![0];
      const chapterElement =
        text.match(/(?<=<div class="col-xs-5 chapter">).+?(?=<\/div>)/g) ?? [];

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
