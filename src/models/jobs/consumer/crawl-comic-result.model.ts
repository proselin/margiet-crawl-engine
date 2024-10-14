import { ComicDocument } from '@/entities/comic';
import { RawCrawledChapter } from '@/jobs/bullmq/shared';

export class CrawlComicResultModel {
  comic: ComicDocument;
  chapters: RawCrawledChapter[];
}
