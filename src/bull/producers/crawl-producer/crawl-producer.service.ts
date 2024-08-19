import { JobConstant } from '@crawl-engine/bull/shared';
import { ConstantBase } from '@crawl-engine/common/utils/constant.base';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CrawlImageData } from '@crawl-engine/bull/shared/types';

@Injectable()
export class CrawlProducerService {
  private logger = new Logger(CrawlProducerService.name);

  constructor(
    @InjectQueue(ConstantBase.QUEUE_CRAWL_NAME)
    private crawlQueue: Queue,
  ) {}

  async addCrawlImageJobs(jobData: CrawlImageData[]) {
    this.logger.log(`Add ${jobData.length} crawl image  jobs to the queue! >>`);
    return await this.crawlQueue.addBulk(
      jobData.map((data) => {
        return {
          name: JobConstant.CRAWL_IMAGE_JOB_NAME,
          data,
          opts: {
            delay: 1000,
          },
        };
      }),
    );
  }
}
