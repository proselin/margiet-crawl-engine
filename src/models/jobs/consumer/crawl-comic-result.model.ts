import { ComicDocument } from '@/entities/comic';
import { RawCrawledChapter } from '@/jobs/bullmq/shared';
import { ImageDocument } from '@/entities/image';

export class CrawlComicResultModel {
  comic: ComicDocument;
  chapters: RawCrawledChapter[];
  thumbImage: ImageDocument | null;
}
