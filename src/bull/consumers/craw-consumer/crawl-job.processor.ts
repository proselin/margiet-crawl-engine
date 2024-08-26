import { JobConstant } from '@crawl-engine/bull/shared';
import { ConstantBase } from '@crawl-engine/common/utils/constant.base';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  CrawlChapterData,
  CrawlComicJobData,
} from '@crawl-engine/bull/shared/types';
import { CrawlComicService } from './crawl-comic.service';
import { CrawlChapterService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-chapter.service';

@Injectable()
@Processor(ConstantBase.QUEUE_CRAWL_NAME)
export class CrawlJobProcessor extends WorkerHost {
  private logger = new Logger(CrawlJobProcessor.name);

  constructor(
    private readonly crawlComicService: CrawlComicService,
    private readonly crawlChapterService: CrawlChapterService,
  ) {
    super();
  }

  async process(job: Job<CrawlComicJobData | CrawlChapterData>): Promise<any> {
    this.logger.log(`Start process ${job.name} with token ${job.token} >>`);
    switch (job.name) {
      case JobConstant.CRAWL_COMIC_JOB_NAME: {
        return await this.crawlComicService.handleCrawlJob(
          job as Job<CrawlComicJobData>,
        );
      }
      case JobConstant.CRAWL_CHAPTER_JOB_NAME: {
        return await this.crawlChapterService.handleCrawlJob(
          job as Job<CrawlChapterData>,
        );
      }
      default: {
        return Promise.reject('Missing job handle');
      }
    }
  }
}
