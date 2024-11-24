import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  CrawlChapterData,
  CrawlComicJobData,
  JobName,
  QueueName,
  UpdateComicJobData,
} from '@/common';
import { BulkJobOptions, Job, Queue } from 'bullmq';
import { UploadImageToDriveJobModel } from '@/models/jobs/producer/upload-image-to-drive-job.model';
import { SyncComicMessageData } from '@/models/jobs/consumer/sync-comic-message-data.model';
import { ComicEntity } from '@/entities/comic';
import { ChapterEntity } from '@/entities/chapter';
import { SyncChapterMessageData } from '@/models/jobs/consumer/sync-chapter-message-data.model';

@Injectable()
export class CrawlProducerService {
  private logger = new Logger(CrawlProducerService.name);

  constructor(
    @InjectQueue(QueueName.QUEUE_CRAWL_NAME)
    private crawlQueue: Queue,
    @InjectQueue(QueueName.QUEUE_UPLOAD_NAME)
    private uploadQueue: Queue,
    @InjectQueue(QueueName.QUEUE_SYNC_NAME)
    private syncQueue: Queue,
  ) {}

  async addCrawlChapterJobs(jobData: CrawlChapterData[]) {
    this.logger.log(
      `Add ${jobData.length} crawl chapter jobs to the queue! >>`,
    );
    return await this.crawlQueue.addBulk(
      jobData.map((data) => {
        return {
          name: JobName.CRAWL_CHAPTER_JOB_NAME,
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
          name: JobName.UPLOAD_DRIVE_JOB_NAME,
          data,
        };
      }),
    );
  }

  async createJobForUploadImage(jobData: UploadImageToDriveJobModel) {
    return this.uploadQueue.add(JobName.UPLOAD_DRIVE_JOB_NAME, jobData);
  }

  /**
   * @param href
   * @description Add a queues crawl comic-fe to queue
   */
  async addCrawlComicJob(href: string) {
    this.logger.log(
      `Add crawl comic with href ${href} to the queue ${QueueName.QUEUE_CRAWL_NAME}`,
    );
    const name = JobName.CRAWL_COMIC_JOB_NAME;
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
      `Add Update comic jobs with comicId : ${comicId} to queue  ${QueueName.QUEUE_CRAWL_NAME}`,
    );
    const name = JobName.UPDATE_COMIC_JOB_NAME;
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
    this.logger.log(
      `Add Update comic jobs with ${comicIds.length} comicId to queue  ${QueueName.QUEUE_CRAWL_NAME}`,
    );
    const name = JobName.UPDATE_COMIC_JOB_NAME;
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

  pushMessageSyncComic(comic: ComicEntity) {
    const syncComicMessageData = new SyncComicMessageData();
    syncComicMessageData.comic_id = comic.id.toString();
    syncComicMessageData.author = {
      name: comic.author?.title,
      id: comic.author?.id.toString(),
    };
    syncComicMessageData.tags = comic.tags.map((tag) => {
      return {
        name: tag?.title,
        id: tag?.id.toString(),
      };
    });
    syncComicMessageData.status = comic.status;
    syncComicMessageData.title = comic.title;
    syncComicMessageData.description = comic.description;
    syncComicMessageData.chapter_count = comic.chapterCount;
    return this.syncQueue.add('sync.comic', syncComicMessageData);
  }

  pushMessageSyncChapter(chapter: ChapterEntity) {
    const syncChapterMessageData: SyncChapterMessageData =
      new SyncChapterMessageData();
    syncChapterMessageData.chapter_id = chapter.id.toString();
    syncChapterMessageData.comic_id = chapter.comic.id.toString();
    syncChapterMessageData.title = chapter.title;
    syncChapterMessageData.position = chapter.position;
    return this.syncQueue.add('sync.chapter', syncChapterMessageData);
  }
}
