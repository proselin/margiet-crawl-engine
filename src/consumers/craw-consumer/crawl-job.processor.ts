import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { CrawlComicService } from "./services/crawl-comic.service";
import { CrawlChapterService } from "./services/crawl-chapter.service";
import {
  CrawlChapterData,
  CrawlComicJobData,
  CrawlImageJobData,
  JobName,
  QueueName,
  UpdateComicJobData,
} from "../../common";
import { CrawlImageService } from "./services/crawl-image.service";

@Processor(QueueName.QUEUE_CRAWL, {
  autorun: true,
  concurrency: +(process.env['queue.crawl.concurrency'] ?? 1),
  removeOnComplete: {
    age: 3600
  }
})
export class CrawlJobProcessor extends WorkerHost {
  private logger = new Logger(CrawlJobProcessor.name);

  constructor(
    private readonly crawlComicService: CrawlComicService,
    private readonly crawlChapterService: CrawlChapterService,
    private readonly crawlImageService: CrawlImageService,
  ) {
    super();
  }

  async process(
    job: Job<
      | CrawlComicJobData
      | CrawlChapterData
      | UpdateComicJobData
      | CrawlImageJobData
      | { comicId: number }
      | { chapterId: number }
    >,
  ): Promise<any> {
    this.logger.log(`Start process ${job.name} with token ${job.token} >>`);
    await job.log(`Start process ${job.name} with token ${job.token} >>`)
    switch (job.name) {
      case JobName.CRAWL_COMIC: {
        return this.crawlComicService.handleCrawlComic(job as Job<CrawlComicJobData>);
      }
      case JobName.CRAWL_CHAPTER: {
        return this.crawlChapterService.handleCrawlChapter(job as Job<CrawlChapterData>);
      }
      case JobName.CRAWL_IMAGE: {
        // return this.crawlImageService.handleCrawlImage(job as Job<CrawlImageJobData>);
        return this.crawlImageService.handleCrawlImageToDrive(job as Job<CrawlImageJobData>);
      }
      case JobName.UPDATE_STATUS_CRAWLING_CHAPTER_DONE: {
        return this.crawlChapterService.handleUpdateStatusChapterToDone(job as Job<{ chapterId: number }>);
      }
      case JobName.UPDATE_STATUS_CRAWLING_COMIC_DONE: {
        return this.crawlComicService.handleUpdateStatusComicToDone(job as Job<{ comicId: number }>);
      }
      case JobName.UPDATE_THUMB_IMAGE_TO_COMIC: {
        return this.crawlComicService.handleUpdateThumbImageToComic(job as Job<{ comicId: number }>);
      }
    }
  }
}
