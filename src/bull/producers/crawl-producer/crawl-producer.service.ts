import { JobConstant } from '@/bull/shared';
import { ConstantBase } from '@/common/utils/constant.base';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CrawlChapterData } from '@/bull/shared/types';

@Injectable()
export class CrawlProducerService {
  private logger = new Logger(CrawlProducerService.name);

  constructor(
    @InjectQueue(ConstantBase.QUEUE_CRAWL_NAME)
    private crawlQueue: Queue,
    @InjectQueue(ConstantBase.QUEUE_UPLOAD_NAME)
    private uploadQueue: Queue,
  ) {}

  async addCrawlChapterJobs(jobData: CrawlChapterData[]) {
    this.logger.log(
      `Add ${jobData.length} crawl chapter jobs to the queue! >>`,
    );
    return await this.crawlQueue.addBulk(
      jobData.map((data) => {
        return {
          name: JobConstant.CRAWL_CHAPTER_JOB_NAME,
          data,
          opts: {
            delay: 1000,
          },
        };
      }),
    );
  }
  async addSyncChapterJob(chapterId: string) {
    return this.uploadQueue.add("SYNC_CHAPTER", {
      id: chapterId
    })
  }
}
