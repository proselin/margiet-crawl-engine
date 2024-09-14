import { JobConstant } from '@/jobs/shared';
import { ConstantBase } from '@/common/utils/constant.base';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { BulkJobOptions, Job, Queue } from 'bullmq';
import {
  CrawlChapterData,
  CrawlComicJobData,
  UpdateComicJobData,
} from '@/jobs/shared/types';

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
    return this.uploadQueue.add('SYNC_CHAPTER', {
      id: chapterId,
    });
  }

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

  /**
   * @description Update comic by re crawl
   * @param comicId id of updated comic
   * @param newUrl
   * @returns Job
   */
  async updateOneCrawlComicJob(
    comicId: string,
    newUrl: string | null,
  ): Promise<Job> {
    this.logger.log(
      `Add Update comic jobs with comicId : ${comicId} to queue  ${ConstantBase.QUEUE_CRAWL_NAME}`,
    );
    const name = JobConstant.UPDATE_COMIC_JOB_NAME;
    const data: UpdateComicJobData = { comicId, newUrl };
    return this.crawlQueue.add(name, data, {
      delay: 3000,
    });
  }

  /**
   * @description Refresh comic data - add bulk jobs
   * @returns Job
   * @param comicIds
   */
  async updateCrawlComicJob(comicIds: string[]): Promise<Job[]> {
    this.logger.log(
      `Add Update comic jobs with ${comicIds.length} comicId to queue  ${ConstantBase.QUEUE_CRAWL_NAME}`,
    );
    const name = JobConstant.UPDATE_COMIC_JOB_NAME;
    const jobs: {
      name: typeof name;
      data: UpdateComicJobData;
      options: BulkJobOptions;
    }[] = comicIds.map((comicId) => {
      return {
        name,
        data: {
          comicId,
          newUrl: null,
        },
        options: {
          delay: 200,
          backoff: 2,
        },
      };
    });
    return this.crawlQueue.addBulk(jobs);
  }
}
