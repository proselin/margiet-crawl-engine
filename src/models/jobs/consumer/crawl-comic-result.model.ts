import { ComicEntity } from '@/entities/comic';
import { RawCrawledChapter } from '@/common';

export class CrawlComicResultModel {
  comic: ComicEntity;
  chapters: RawCrawledChapter[];
}
