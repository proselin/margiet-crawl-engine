import { JobConstant } from '@crawl-engine/bull/shared';
import { ConstantBase } from '@crawl-engine/common/utils/constant.base';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BulkJobOptions } from 'bullmq/dist/esm/interfaces';
import {
  CrawlChapterData,
  CrawlChapterDataQueueRequest,
  CrawlComicJobData,
  CrawlImageData,
  CrawlImageDataQueueRequest,
} from '@crawl-engine/bull/shared/types';

@Injectable()
export class CrawlProducerService {
  private logger = new Logger(CrawlProducerService.name);

  constructor(
    @InjectQueue(ConstantBase.QUEUE_CRAWL_NAME)
    private crawlQueue: Queue,
  ) {}

  async addCrawlComicJob(href: string) {
    this.logger.log(
      `Add crawl comic with href ${href} to the queue ${ConstantBase.QUEUE_CRAWL_NAME}`,
    );
    const name = JobConstant.CRAWL_COMIC_JOB_NAME;
    const data: CrawlComicJobData = { href };
    return await this.crawlQueue.add(name, data);
  }

  async addCrawlImageJobs(images: CrawlImageData[], options?: BulkJobOptions) {
    this.logger.log(`Add ${images.length} Crawl image job to the queue! >>`);
    const jobs: CrawlImageDataQueueRequest[] = images.map((data) => {
      return {
        name: JobConstant.CRAWL_IMAGE_JOB_NAME,
        data,
        opts: options,
      };
    });
    return await this.crawlQueue.addBulk(jobs);
  }

  async addCrawlChapterJobs(
    chaptersData: CrawlChapterData[],
    options?: BulkJobOptions,
  ) {
    this.logger.log(
      `Add ${chaptersData.length} Crawl chapter job to the queue! >>`,
    );
    const jobs: CrawlChapterDataQueueRequest[] = chaptersData.map((data) => {
      return {
        name: JobConstant.CRAWL_CHAPTER_JOB_NAME,
        data,
        opts: options,
      };
    });
    return await this.crawlQueue.addBulk(jobs);
  }
}
