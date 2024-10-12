import { AuthorModule } from '@/entities/author/author.module';
import { CrawlChapterService } from '@/jobs/bullmq/consumers/craw-consumer/crawl-chapter.service';
import { CrawlComicService } from '@/jobs/bullmq/consumers/craw-consumer/crawl-comic.service';
import { CrawlImageService } from '@/jobs/bullmq/consumers/craw-consumer/crawl-image.service';
import { CrawlUploadService } from '@/jobs/bullmq/consumers/craw-consumer/crawl-upload.service';
import { CrawlProducerModule } from '@/jobs/bullmq/producers/crawl-producer';
import { ChapterModule } from '@/entities/chapter/chapter.module';
import { ComicModule } from '@/entities/comic/comic.module';
import { GoogleDriveApiModule } from '@/connection/google-drive-api';
import { Constant } from '@/utils/constant';
import { ImageModule } from '@/entities/image/image.module';
import { TagModule } from '@/entities/tag/tag.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { CrawlJobProcessor } from './crawl-job.processor';
import { MinioConnectModule } from '@/connection/minio';

@Module({
  imports: [
    GoogleDriveApiModule,
    BullModule.registerQueue({
      name: Constant.QUEUE_CRAWL_NAME,
    }),
    BullModule.registerQueue({
      name: Constant.QUEUE_UPLOAD_NAME,
    }),
    // RmqProducerModule,
    MinioConnectModule,
    PuppeteerModule.forFeature([]),
    CrawlProducerModule,
    ChapterModule,
    AuthorModule,
    ComicModule,
    TagModule,
    ImageModule,
  ],
  providers: [
    CrawlJobProcessor,
    CrawlImageService,
    CrawlComicService,
    CrawlUploadService,
    CrawlChapterService,
  ],
})
export class CrawlConsumerModule {}
