import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConstantBase } from '@crawl-engine/common/utils/constant.base';
import { Queue } from 'bullmq';
import { CrawlChapterObject } from '@crawl-engine/bull/shared/types';
import { BulkJobOptions } from 'bullmq/dist/esm/interfaces';
import { BullConstant } from '@crawl-engine/bull/shared';
import {
  CrawlChapterJobDataDto,
  CrawlChapterJobResultDto,
} from '@crawl-engine/bull/shared/dto';

export type JobType = {
  name: string;
  data: CrawlChapterJobDataDto;
  opts?: BulkJobOptions;
};

@Injectable()
export class CrawlProducerService {
  private logger = new Logger(CrawlProducerService.name);

  constructor(
    @InjectQueue(ConstantBase.QUEUE_CRAWL_NAME)
    private crawlQueue: Queue<CrawlChapterJobDataDto, CrawlChapterJobResultDto>,
  ) {}

  addCrawlChapterJob(data: CrawlChapterObject[]) {
    this.logger.log(`Add ${data.length} Crawl chapter job to the queue! >>`)
    const jobs: JobType[] = data.map((chapterObj) => {
      const jobData = new CrawlChapterJobDataDto();
      jobData.chapterId = chapterObj.chapterId;
      jobData.chapterURL = chapterObj.chapterURL;
      jobData.chapterNumber = chapterObj.chapterNumber;
      return {
        name: BullConstant.CRAWL_CHAPTER_JOB_NAME,
        data: jobData,
        opts: {
          delay: 1000,
        },
      };
    });
    this.logger.log(
      `Input ${jobs.length} jobs to Queue ${ConstantBase.QUEUE_CRAWL_NAME} data >>>`,
    );
    return this.crawlQueue.addBulk(jobs);
  }
}
