import { Injectable, Logger } from "@nestjs/common";
import { InjectFlowProducer, InjectQueue } from "@nestjs/bullmq";
import { BulkJobOptions, FlowChildJob, FlowProducer, Job, Queue } from "bullmq";

import {
  CrawlChapterData,
  CrawlComicJobData,
  CrawlImageJobData,
  FlowName,
  JobName,
  QueueName,
  UpdateComicJobData,
} from "../../common";

@Injectable()
export class CrawlProducerService {
  private logger = new Logger(CrawlProducerService.name);

  constructor(
    @InjectQueue(QueueName.QUEUE_CRAWL)
    private crawlQueue: Queue,
    @InjectFlowProducer(FlowName.CRAWL_COMIC)
    private crawlComicFlow: FlowProducer,
  ) {}

  async addCrawlChapterJobs(jobData: CrawlChapterData[]) {
    this.logger.log(`Add ${jobData.length} crawl chapter jobs to the queue! >>`);
    return await this.crawlQueue.addBulk(
      jobData.map(data => {
        return {
          name: JobName.CRAWL_CHAPTER,
          data,
          opts: {
            delay: 1000,
          },
        };
      }),
    );
  }

  /**
   * @param href
   * @description Add a queues crawl comic-fe to queue
   */
  async addCrawlComicJob(href: string) {
    this.logger.log(`Add crawl comic with href ${href} to the queue ${QueueName.QUEUE_CRAWL}`);
    const name = JobName.CRAWL_COMIC;
    const data: CrawlComicJobData = { href };
    return await this.crawlQueue.add(name, data);
  }

  /**
   * @description Update comic-fe by re crawl
   * @param comicId id of updated comic-fe
   * @param newUrl
   * @returns Job
   */
  async updateOneCrawlComicJob(comicId: number, newUrl: string | null): Promise<Job> {
    this.logger.log(`Add Update comic jobs with comicId : ${comicId} to queue  ${QueueName.QUEUE_CRAWL}`);
    const name = JobName.UPDATE_COMIC;
    const data: UpdateComicJobData = { comicId, newUrl };
    return this.crawlQueue.add(name, data, {
      delay: 3000,
    });
  }

  /**
   * @description Refresh comic-fe data - add bulk queues
   * @returns Job
   * @param comicIds
   */
  async updateCrawlComicJob(comicIds: number[]): Promise<Job[]> {
    this.logger.log(`Add Update comic jobs with ${comicIds.length} comicId to queue  ${QueueName.QUEUE_CRAWL}`);
    const name = JobName.UPDATE_COMIC;
    const jobs: {
      name: typeof name;
      data: UpdateComicJobData;
      options: BulkJobOptions;
    }[] = comicIds.map(comicId => {
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

  async addFlowCrawlChapterByComic(jobData: CrawlChapterData[], comicId: number) {
    return this.crawlComicFlow.add({
      queueName: QueueName.QUEUE_CRAWL,
      name: JobName.UPDATE_STATUS_CRAWLING_COMIC_DONE,
      data: {
        comicId,
      },
      children: jobData.map(data => {
        return {
          queueName: QueueName.QUEUE_CRAWL,
          name: JobName.CRAWL_CHAPTER,
          data,
          opts: {
            delay: 100,
          },
        } satisfies FlowChildJob;
      }) as FlowChildJob[],
    });
  }

  async addFlowCrawlImagesByChapter(jobData: CrawlImageJobData[], chapterId: number) {
    return this.crawlComicFlow.add({
      queueName: QueueName.QUEUE_CRAWL,
      name: JobName.UPDATE_STATUS_CRAWLING_CHAPTER_DONE,
      data: {
        chapterId,
      },
      children: jobData.map(data => {
        return {
          queueName: QueueName.QUEUE_CRAWL,
          name: JobName.CRAWL_IMAGE,
          data,
          opts: {
            delay: 200,
          },
        } satisfies FlowChildJob;
      }) as FlowChildJob[],
    });
  }

  async addFlowCrawlThumbByComic(jobData: CrawlImageJobData, comicId: number) {
    return this.crawlComicFlow.add({
      queueName: QueueName.QUEUE_CRAWL,
      name: JobName.UPDATE_THUMB_IMAGE_TO_COMIC,
      data: {
        comicId,
      },
      children: [
        {
          name: JobName.CRAWL_IMAGE,
          data: jobData,
          queueName: QueueName.QUEUE_CRAWL,
        },
      ],
    });
  }
}
