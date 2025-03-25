import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { CrawlComicService } from './services/crawl-comic.service';
import { CrawlChapterService } from './services/crawl-chapter.service';

import { CrawlProducerService } from '../producers';
import {
  CrawlChapterResultModel,
  CrawlComicJobData,
  CrawlComicResultModel,
  ICrawlChapterData,
  IUpdateComicJobData,
  UpdateComicResultModel,
} from '../../models';
import { UploadImageToDriveJobModel } from '../../models';
import { JOB_NAME, QUEUE_NAME } from '@shared/common';

@Processor(QUEUE_NAME.QUEUE_CRAWL_NAME, {
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
    job: Job<CrawlComicJobData | ICrawlChapterData | IUpdateComicJobData>,
  ): Promise<any> {
    this.logger.log(`Start process ${job.name} with token ${job.token} >>`);
    switch (job.name) {
      case JOB_NAME.CRAWL_COMIC: {
        return this.crawlComicService.crawlComicInfo(
          job as Job<CrawlComicJobData>,
        );
      }
      case JOB_NAME.CRAWL_CHAPTER: {
        return this.crawlChapterService.crawlChapterInfo(
          job as Job<ICrawlChapterData>,
        );
      }
      case JOB_NAME.UPDATE_COMIC: {
        return this.crawlComicService.updateComicCrawled(
          job as Job<IUpdateComicJobData>,
        );
      }
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    switch (job.name) {
      case JOB_NAME.CRAWL_COMIC: {
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
      case JOB_NAME.CRAWL_CHAPTER: {
        const resultCrawlChapter: CrawlChapterResultModel = job.returnvalue;
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
      case JOB_NAME.UPDATE_COMIC: {
        const updateComicResult: UpdateComicResultModel = job.returnvalue;
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
