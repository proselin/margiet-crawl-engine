import { JobConstant } from '@/jobs/bullmq/shared';
import { Constant } from '@/utils/constant';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { BulkJobOptions, Job, Queue } from 'bullmq';
import {
  CrawlChapterData,
  CrawlComicJobData,
  UpdateComicJobData,
} from '@/jobs/bullmq/shared/types';
import { UploadImageToDriveJobModel } from '@/models/jobs/producer/upload-image-to-drive-job.model';
import { ComicDocument } from '@/entities/comic';
import { SyncComicMessageData } from '@/models/jobs/consumer/sync-comic-message-data.model';
import { ChapterDocument } from '@/entities/chapter';
import { SyncChapterMessageData } from '@/models/jobs/consumer/sync-chapter-message-data.model';

@Injectable()
export class CrawlProducerService {
  private logger = new Logger(CrawlProducerService.name);

  constructor(
    @InjectQueue(Constant.QUEUE_CRAWL_NAME)
    private crawlQueue: Queue,
    @InjectQueue(Constant.QUEUE_UPLOAD_NAME)
    private uploadQueue: Queue,
    @InjectQueue(Constant.QUEUE_SYNC_NAME)
    private syncQueue: Queue,
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

  async addUploadImageBulk(imageJobData: UploadImageToDriveJobModel[]) {
    return this.uploadQueue.addBulk(
      imageJobData.map((data) => {
        return {
          name: JobConstant.UPLOAD_JOB_NAME,
          data,
        };
      }),
    );
  }

  /**
   * @param href
   * @description Add a jobs crawl comic-fe to queue
   */
  async addCrawlComicJob(href: string) {
    this.logger.log(
      `Add crawl comic with href ${href} to the queue ${Constant.QUEUE_CRAWL_NAME}`,
    );
    const name = JobConstant.CRAWL_COMIC_JOB_NAME;
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
    comicId: string,
    newUrl: string | null,
  ): Promise<Job> {
    this.logger.log(
      `Add Update comic jobs with comicId : ${comicId} to queue  ${Constant.QUEUE_CRAWL_NAME}`,
    );
    const name = JobConstant.UPDATE_COMIC_JOB_NAME;
    const data: UpdateComicJobData = { comicId, newUrl };
    return this.crawlQueue.add(name, data, {
      delay: 3000,
    });
  }

  /**
   * @description Refresh comic-fe data - add bulk jobs
   * @returns Job
   * @param comicIds
   */
  async updateCrawlComicJob(comicIds: string[]): Promise<Job[]> {
    this.logger.log(
      `Add Update comic jobs with ${comicIds.length} comicId to queue  ${Constant.QUEUE_CRAWL_NAME}`,
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

  pushMessageSyncComic(comic: ComicDocument) {
    const syncComicMessageData = new SyncComicMessageData();
    syncComicMessageData.comic_id = comic._id.toString();
    syncComicMessageData.author = {
      name: comic.author?.title,
      id: comic.author?._id.toString(),
    };
    syncComicMessageData.tags = comic.tags.map((tag) => {
      return {
        name: tag?.title,
        id: tag?._id.toString(),
      };
    });
    syncComicMessageData.status = comic.status;
    syncComicMessageData.name = comic.title;
    syncComicMessageData.description = comic.description;
    syncComicMessageData.chapter_count = comic.chapter_count;
    return this.syncQueue.add('sync.comic', syncComicMessageData);
  }

  pushMessageSyncChapter(chapter: ChapterDocument) {
    const syncChapterMessageData: SyncChapterMessageData =
      new SyncChapterMessageData();
    syncChapterMessageData.chapter_id = chapter.id;
    syncChapterMessageData.comic_id = chapter.comicId;
    syncChapterMessageData.name = chapter.title;
    syncChapterMessageData.position = chapter.position;
    return this.syncQueue.add('sync.chapter', syncChapterMessageData);
  }
}
