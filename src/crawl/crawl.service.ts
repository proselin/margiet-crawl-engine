import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConstantBase } from '@crawl-engine/common/utils/constant.base';
import { JobConstant } from '@crawl-engine/bull/shared';
import { CrawlComicJobData } from '@crawl-engine/bull/shared/types';

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);

  constructor(
    @InjectQueue(ConstantBase.QUEUE_CRAWL_NAME)
    private crawlQueue: Queue,
  ) {}

  /**
   * @param href
   * @description Add a job crawl comic to queue
   */
  async addCrawlComicJob(href: string) {
    this.logger.log(
      `Add crawl comic with href ${href} to the queue ${ConstantBase.QUEUE_CRAWL_NAME}`,
    );
    const name = JobConstant.CRAWL_COMIC_JOB_NAME;
    const data: CrawlComicJobData = { href };
    return await this.crawlQueue.add(name, data);
  }
}
