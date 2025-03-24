import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { BulkJobOptions, Job, Queue } from 'bullmq';
import {
  CrawlComicJobData,
  ICrawlChapterData,
  IUpdateComicJobData,
  UploadImageToDriveJobModel,
} from '../../../models';
import { JOB_NAME, QUEUE_NAME } from '@libs/common';

@Injectable()
export class CrawlProducerService {
  private logger = new Logger(CrawlProducerService.name);

  constructor(
    @InjectQueue(QUEUE_NAME.QUEUE_CRAWL_NAME)
    private crawlQueue: Queue,
    @InjectQueue(QUEUE_NAME.QUEUE_UPLOAD_NAME)
    private uploadQueue: Queue,
  ) {}

  async addCrawlChapterJobs(jobData: ICrawlChapterData[]) {
    this.logger.log(
      `Add ${jobData.length} crawl chapter jobs to the queue! >>`,
    );
    return await this.crawlQueue.addBulk(
      jobData.map((data) => {
        return {
          name: JOB_NAME.CRAWL_CHAPTER,
          data,
          opts: {
            delay: 1000,
          },
        };
      }),
    );
  }

  async addUploadImageBulk(imageJobData: UploadImageToDriveJobModel[]) {
    return this.uploadQueue.addBulk(
      imageJobData.map((data) => {
        return {
          name: JOB_NAME.UPLOAD_DRIVE,
          data,
        };
      }),
    );
  }

  async createJobForUploadImage(jobData: UploadImageToDriveJobModel) {
    return this.uploadQueue.add(JOB_NAME.UPLOAD_DRIVE, jobData);
  }

  /**
   * @param href
   * @description Add a queues crawl comic-fe to queue
   */
  async addCrawlComicJob(href: string) {
    this.logger.log(
      `Add crawl comic with href ${href} to the queue ${QUEUE_NAME.QUEUE_CRAWL_NAME}`,
    );
    const name = JOB_NAME.CRAWL_COMIC;
    const data: CrawlComicJobData = { href };
    return await this.crawlQueue.add(name, data);
  }

  /**
   * @description Update comic-fe by re crawl
   * @param comicId id of updated comic-fe
   * @param newUrl
   * @returns Job
   */
  async updateOneCrawlComicJob(
    comicId: number,
    newUrl: string | null,
  ): Promise<Job> {
    this.logger.log(
      `Add Update comic jobs with comicId : ${comicId} to queue  ${QUEUE_NAME.QUEUE_CRAWL_NAME}`,
    );
    const data: IUpdateComicJobData = { comicId, newUrl };
    return this.crawlQueue.add(JOB_NAME.UPDATE_COMIC, data);
  }

  /**
   * @description Refresh comic-fe data - add bulk queues
   * @returns Job
   * @param comicIds
   */
  async updateCrawlComicJob(comicIds: number[]): Promise<Job[]> {
    this.logger.log(
      `Add Update comic jobs with ${comicIds.length} comicId to queue ${QUEUE_NAME.QUEUE_CRAWL_NAME}`,
    );
    const jobs: {
      name: string;
      data: IUpdateComicJobData;
      options: BulkJobOptions;
    }[] = comicIds.map((comicId) => {
      return {
        name: JOB_NAME.UPDATE_COMIC,
        data: {
          comicId,
          newUrl: null,
        },
        options: {
          backoff: 2,
        },
      };
    });
    return this.crawlQueue.addBulk(jobs);
  }
}
