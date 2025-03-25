import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CrawlProducerModule } from '../producers';
import { CrawlImageService } from './services/crawl-image.service';
import { CrawlComicService } from './services/crawl-comic.service';
import { CrawlUploadService } from './services/crawl-upload.service';
import { CrawlChapterService } from './services/crawl-chapter.service';
import { NettruyenHttpService } from './services/nettruyen-http.service';
import { CrawlJobProcessor } from './crawl-job.processor';
import { NettruyenExtractor } from './extractor/nettruyen.extractor';
import { QUEUE_NAME } from '@shared/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChapterEntity,
  ComicEntity,
  DriverUploadHistory,
  ImageEntity,
  MinioUploadHistory,
} from '@shared/database';
import { MinioConfigModule } from '@shared/minio';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: QUEUE_NAME.QUEUE_CRAWL_NAME,
      },
      {
        name: QUEUE_NAME.QUEUE_UPLOAD_NAME,
      },
    ),
    MinioConfigModule,
    CrawlProducerModule,
    TypeOrmModule.forFeature([
      ComicEntity,
      ChapterEntity,
      ImageEntity,
      DriverUploadHistory,
      MinioUploadHistory,
    ]),
  ],
  providers: [
    CrawlJobProcessor,
    NettruyenHttpService,
    CrawlChapterService,
    CrawlImageService,
    CrawlUploadService,
    CrawlComicService,
    NettruyenExtractor,
  ],
})
export class CrawlConsumerModule {}
