import { BulkJobOptions } from 'bullmq/dist/esm/interfaces';
import { ImageRawDataCrawl } from '@crawl-engine/bull/shared';

export interface CrawlComicJobData {
  href: string;
}

export interface CrawlChapterData {
  chapterId: string;
  chapterNumber: string;
  dataId: string;
  chapterURL: string;
}

export interface CrawlImageData extends ImageRawDataCrawl {
  chapterId: string;
  imageId: string;
  position: number;
}

export interface JobBulkRequest<dataType = any> {
  name: string;
  data: dataType;
  opts?: BulkJobOptions;
}

export interface CrawlImageDataQueueRequest
  extends JobBulkRequest<CrawlImageData> {}

export interface CrawlChapterDataQueueRequest
  extends JobBulkRequest<CrawlChapterData> {}
