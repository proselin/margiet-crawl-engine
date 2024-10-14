import { JobConstant } from '@/jobs/bullmq/shared';
import { Constant } from '@/utils/constant';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  CrawlChapterData,
  CrawlComicJobData,
  UpdateComicJobData,
} from '@/jobs/bullmq/shared/types';
import { CrawlComicService } from './services/crawl-comic.service';
import { CrawlChapterService } from '@/jobs/bullmq/consumers/craw-consumer/services/crawl-chapter.service';
import { CrawlComicResultModel } from '@/models/jobs/consumer/crawl-comic-result.model';
import { SyncComicRmqProducer } from '@/jobs/rabbitmq/producer/sync-comic-rmq.producer';
import { CrawlChapterResultModel } from '@/models/jobs/consumer/crawl-chapter-result.model';
import { UpdateComicResultModel } from '@/models/jobs/consumer/update-comic-result.model';

@Injectable()
@Processor(Constant.QUEUE_CRAWL_NAME)
export class CrawlJobProcessor extends WorkerHost {
  private logger = new Logger(CrawlJobProcessor.name);

  constructor(
    private readonly crawlComicService: CrawlComicService,
    private readonly crawlChapterService: CrawlChapterService,
    private readonly syncComicRmqProducer: SyncComicRmqProducer,
  ) {
    super();
  }

  async process(
    job: Job<CrawlComicJobData | CrawlChapterData | UpdateComicJobData>,
  ): Promise<any> {
    this.logger.log(`Start process ${job.name} with token ${job.token} >>`);
    switch (job.name) {
      case JobConstant.CRAWL_COMIC_JOB_NAME: {
        return this.crawlComicService.handleCrawlJob(
          job as Job<CrawlComicJobData>,
        );
      }
      case JobConstant.CRAWL_CHAPTER_JOB_NAME: {
        return this.crawlChapterService.handleCrawlJob(
          job as Job<CrawlChapterData>,
        );
      }
      case JobConstant.UPDATE_COMIC_JOB_NAME: {
        return this.crawlComicService.handleUpdateComic(
          job as Job<UpdateComicJobData>,
        );
      }
      default: {
        return Promise.reject('Missing jobs handle');
      }
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    switch (job.name) {
      case JobConstant.CRAWL_COMIC_JOB_NAME: {
        const crawledComicResponse: CrawlComicResultModel = job.data;
        await this.crawlComicService.addJobCrawlChapters(
          crawledComicResponse.chapters,
          crawledComicResponse.comic.id,
        );
        await this.syncComicRmqProducer.pushMessageSyncComic(
          crawledComicResponse.comic,
        );
        return;
      }
      case JobConstant.CRAWL_CHAPTER_JOB_NAME: {
        const resultCrawlChapter: CrawlChapterResultModel = job.data;
        await this.syncComicRmqProducer.pushMessageSyncChapter(
          resultCrawlChapter.chapter,
        );
        await this.crawlChapterService.addJobUploadImage(
          resultCrawlChapter.images,
          resultCrawlChapter.chapter.id,
        );
        return;
      }
      case JobConstant.UPDATE_COMIC_JOB_NAME: {
        const updateComicResult: UpdateComicResultModel = job.data;
        await this.syncComicRmqProducer.pushMessageSyncComic(
          updateComicResult.comic,
        );
        await this.crawlComicService.addJobCrawlChapters(
          updateComicResult.updateChapters,
          updateComicResult.comic.id,
        );
        return;
      }
      default: {
        return Promise.reject('Missing jobs return handler');
      }
    }
  }
}
