import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { CrawlComicService } from './services/crawl-comic.service';
import { CrawlChapterService } from './services/crawl-chapter.service';
import {
  CrawlChapterData,
  CrawlComicJobData,
  JobName,
  QueueName,
  UpdateComicJobData,
} from '../../../common';
import { CrawlProducerService } from '../../producers/crawl-producer';
import {
  CrawlChapterResultModel,
  CrawlComicResultModel,
  UpdateComicResultModel,
} from '../../../models/jobs';
import { UploadImageToDriveJobModel } from '../../../models/jobs/producer/upload-image-to-drive-job.model';

@Processor(QueueName.QUEUE_CRAWL_NAME, {
  concurrency: 3,
})
export class CrawlJobProcessor extends WorkerHost {
  private logger = new Logger(CrawlJobProcessor.name);

  constructor(
    private readonly crawlComicService: CrawlComicService,
    private readonly crawlChapterService: CrawlChapterService,
    private readonly crawlProducerService: CrawlProducerService,
  ) {
    super();
  }

  async process(
    job: Job<CrawlComicJobData | CrawlChapterData | UpdateComicJobData>,
  ): Promise<any> {
    this.logger.log(`Start process ${job.name} with token ${job.token} >>`);
    switch (job.name) {
      case JobName.CRAWL_COMIC_JOB_NAME: {
        return this.crawlComicService.crawlComicInfo(
          job as Job<CrawlComicJobData>,
        );
      }
      case JobName.CRAWL_CHAPTER_JOB_NAME: {
        return this.crawlChapterService.crawlChapterInfo(
          job as Job<CrawlChapterData>,
        );
      }
      case JobName.UPDATE_COMIC_JOB_NAME: {
        return this.crawlComicService.updateComicCrawled(
          job as Job<UpdateComicJobData>,
        );
      }
      default: {
        throw new Error('Missing job handler');
      }
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    switch (job.name) {
      case JobName.CRAWL_COMIC_JOB_NAME: {
        const response: CrawlComicResultModel = job.returnvalue;
        await this.crawlComicService.createJobCrawlForChapter(
          response.chapters,
          response.comic.id,
        );
        // await this.crawlProducerService.pushMessageSyncComic(response.comic);
        if (!response.comic.thumbImage) return;
        const thumbImage = await response.comic.thumbImage;
        await this.crawlProducerService.createJobForUploadImage({
          url: thumbImage.url,
          position: thumbImage.position,
          comicId: response.comic.id,
          fileName: (await thumbImage.minioUploadHistory).fileName,
          bucket: (await thumbImage.minioUploadHistory).bucketName,
          imageId: thumbImage.id,
          chapterId: null,
        });
        return;
      }
      case JobName.CRAWL_CHAPTER_JOB_NAME: {
        const resultCrawlChapter: CrawlChapterResultModel = job.returnvalue;
        await this.crawlProducerService.pushMessageSyncChapter(
          resultCrawlChapter.chapter,
        );
        const uploadJobDataModels: UploadImageToDriveJobModel[] =
          await Promise.all(
            resultCrawlChapter.images.map(async (image) => {
              const model = new UploadImageToDriveJobModel();
              model.bucket = (await image.minioUploadHistory).bucketName;
              model.url = image.url;
              model.imageId = image.id;
              model.fileName = (await image.minioUploadHistory).fileName;
              model.chapterId = resultCrawlChapter.chapter.id;
              model.position = image.position;
              return model;
            }),
          );
        await this.crawlProducerService.addUploadImageBulk(uploadJobDataModels);
        return;
      }
      case JobName.UPDATE_COMIC_JOB_NAME: {
        const updateComicResult: UpdateComicResultModel = job.returnvalue;
        await this.crawlProducerService.pushMessageSyncComic(
          updateComicResult.comic,
        );
        await this.crawlComicService.createJobCrawlForChapter(
          updateComicResult.updateChapters,
          updateComicResult.comic.id,
        );
        return;
      }
      default: {
        return Promise.reject('Missing queues return handler');
      }
    }
  }
}
