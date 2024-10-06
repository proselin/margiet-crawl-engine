import { AuthorModule } from '@/models/author/author.module';
import { CrawlChapterService } from '@/jobs/consumers/craw-consumer/crawl-chapter.service';
import { CrawlComicService } from '@/jobs/consumers/craw-consumer/crawl-comic.service';
import { CrawlImageService } from '@/jobs/consumers/craw-consumer/crawl-image.service';
import { CrawlUploadService } from '@/jobs/consumers/craw-consumer/crawl-upload.service';
import { CrawlProducerModule } from '@/jobs/producers/crawl-producer';
import { ChapterModule } from '@/models/chapter/chapter.module';
import { ComicModule } from '@/models/comic/comic.module';
import { GoogleDriveApiModule } from '@/common/connection/google-drive-api';
import { ConstantBase } from '@/common/utils/constant.base';
import { ImageModule } from '@/models/image/image.module';
import { StatusModule } from '@/models/status/status.module';
import { TagModule } from '@/models/tag/tag.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { CrawlJobProcessor } from './crawl-job.processor';
import { MinioConnectModule } from '@/common/connection/minio';
import { RmqProducerModule } from '@/rabbitmq/producer/rmq-producer.module';

@Module({
  imports: [
    GoogleDriveApiModule,
    BullModule.registerQueue({
      name: ConstantBase.QUEUE_CRAWL_NAME,
    }),
    BullModule.registerQueue({
      name: ConstantBase.QUEUE_UPLOAD_NAME,
    }),
    RmqProducerModule,
    MinioConnectModule,
    PuppeteerModule.forFeature([]),
    CrawlProducerModule,
    ChapterModule,
    AuthorModule,
    ComicModule,
    StatusModule,
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
