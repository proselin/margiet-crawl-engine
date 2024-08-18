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
  RawImageDataPushJob,
} from '@crawl-engine/bull/shared/types';

@Injectable()
export class CrawlProducerService {
  private logger = new Logger(CrawlProducerService.name);

  constructor(
    @InjectQueue(ConstantBase.QUEUE_CRAWL_NAME)
    private crawlQueue: Queue,
  ) {}

  /**
   * @deprecated move to margiet microservice
   * @param href
   * @description Add a job crawl comic to queue
   */
  async addCrawlComicJob(href: string) {
    throw new Error(
      'This method is no longer stay in crawl engine it had move to margiet microservice ',
    );

    this.logger.log(
      `Add crawl comic with href ${href} to the queue ${ConstantBase.QUEUE_CRAWL_NAME}`,
    );
    const name = JobConstant.CRAWL_COMIC_JOB_NAME;
    const data: CrawlComicJobData = { href };
    return await this.crawlQueue.add(name, data);
  }

  async addCrawlImageJobs(
    images: RawImageDataPushJob[],
    chapterUrl: string,
    chapterId: string,
  ) {
    this.logger.log(
      `Add a crawl job with ${images.length} image job to the queue! >>`,
    );
    const requestQueue: CrawlImageData = {
      chapterId,
      chapterUrl,
      imageData: images,
    };
    return await this.crawlQueue.add(
      JobConstant.CRAWL_IMAGE_JOB_NAME,
      requestQueue,
      {
        delay: 1000,
      },
    );
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
