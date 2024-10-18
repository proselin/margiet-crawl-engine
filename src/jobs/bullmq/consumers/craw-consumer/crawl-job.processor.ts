import { JobConstant } from '@/jobs/bullmq/shared';
import { Constant } from '@/utils/constant';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  CrawlChapterData,
  CrawlComicJobData,
  UpdateComicJobData,
} from '@/jobs/bullmq/shared/types';
import { CrawlComicService } from './services/crawl-comic.service';
import { CrawlChapterService } from '@/jobs/bullmq/consumers/craw-consumer/services/crawl-chapter.service';
import { CrawlComicResultModel } from '@/models/jobs/consumer/crawl-comic-result.model';
import { CrawlChapterResultModel } from '@/models/jobs/consumer/crawl-chapter-result.model';
import { UpdateComicResultModel } from '@/models/jobs/consumer/update-comic-result.model';
import { CrawlProducerService } from '@/jobs/bullmq/producers/crawl-producer';
import { UploadImageToDriveJobModel } from '@/models/jobs/producer/upload-image-to-drive-job.model';

@Injectable()
@Processor(Constant.QUEUE_CRAWL_NAME)
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
      case JobConstant.CRAWL_COMIC_JOB_NAME: {
        return this.crawlComicService.handleCrawlJob(
          job as Job<CrawlComicJobData>,
        );
      }
      case JobConstant.CRAWL_CHAPTER_JOB_NAME: {
        return this.crawlChapterService.handleCrawlJob(
          job as Job<CrawlChapterData>,
        );
      }
      case JobConstant.UPDATE_COMIC_JOB_NAME: {
        return this.crawlComicService.handleUpdateComic(
          job as Job<UpdateComicJobData>,
        );
      }
      default: {
        return Promise.reject('Missing jobs handle');
      }
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    switch (job.name) {
      case JobConstant.CRAWL_COMIC_JOB_NAME: {
        const crawledComicResponse: CrawlComicResultModel = job.returnvalue;
        await this.crawlComicService.addJobCrawlChapters(
          crawledComicResponse.chapters,
          crawledComicResponse.comic._id.toString(),
        );
        await this.crawlProducerService.pushMessageSyncComic(
          crawledComicResponse.comic,
        );
        return;
      }
      case JobConstant.CRAWL_CHAPTER_JOB_NAME: {
        const resultCrawlChapter: CrawlChapterResultModel = job.returnvalue;
        await this.crawlProducerService.pushMessageSyncChapter(
          resultCrawlChapter.chapter,
        );
        const uploadJobDataModels: UploadImageToDriveJobModel[] =
          resultCrawlChapter.images.map((image) => {
            const model = new UploadImageToDriveJobModel();
            model.bucket = image.minioInfo.bucketName;
            model.url = image.url;
            model.imageId = image._id.toString();
            model.fileName = image.minioInfo.fileName;
            model.chapterId = resultCrawlChapter.chapter._id.toString();
            model.position = image.position;
            return model;
          });
        await this.crawlProducerService.addUploadImageBulk(uploadJobDataModels);
        return;
      }
      case JobConstant.UPDATE_COMIC_JOB_NAME: {
        const updateComicResult: UpdateComicResultModel = job.returnvalue;
        await this.crawlProducerService.pushMessageSyncComic(
          updateComicResult.comic,
        );
        await this.crawlComicService.addJobCrawlChapters(
          updateComicResult.updateChapters,
          updateComicResult.comic._id.toString(),
        );
        return;
      }
      default: {
        return Promise.reject('Missing jobs return handler');
      }
    }
  }
}
