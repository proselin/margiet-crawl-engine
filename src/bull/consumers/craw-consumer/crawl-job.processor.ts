import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CrawlChapterJobDataDto, CrawlChapterJobResultDto } from '@crawl-engine/bull/shared/dto';
import { ConstantBase } from '@crawl-engine/common/utils/constant.base';
import { BullConstant } from '@crawl-engine/bull/shared';
import { CrawlConsumerService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-consumer.service';

@Injectable()
@Processor(ConstantBase.QUEUE_CRAWL_NAME)
export class CrawlJobProcessor extends WorkerHost {
  private logger = new Logger(CrawlJobProcessor.name);

  constructor(private crawlConsumer: CrawlConsumerService) {
    super();
  }

  async process(job: Job<CrawlChapterJobDataDto, CrawlChapterJobResultDto>, token?: string): Promise<any> {
    this.logger.log(`Start process ${job.name} with token ${job.token} >>`);
    switch (job.name){
      case BullConstant.CRAWL_CHAPTER_JOB_NAME: {
        return await this.crawlConsumer.handleCrawlJob(job);
      }
      default: {
        return Promise.reject("Missing job handle")
      }
    }


  }
}
