import { AuthorModule } from '@/author/author.module';
import { CrawlChapterService } from '@/bull/consumers/craw-consumer/crawl-chapter.service';
import { CrawlComicService } from '@/bull/consumers/craw-consumer/crawl-comic.service';
import { CrawlImageService } from '@/bull/consumers/craw-consumer/crawl-image.service';
import { CrawlUploadService } from '@/bull/consumers/craw-consumer/crawl-upload.service';
import { CrawlProducerModule } from '@/bull/producers/crawl-producer';
import { ChapterModule } from '@/chapter/chapter.module';
import { ComicModule } from '@/comic/comic.module';
import { GoogleDriveApiModule } from '@common/connection/google-drive-api';
import { ConstantBase } from '@common/utils/constant.base';
import { ImageModule } from '@/image/image.module';
import { StatusModule } from '@/status/status.module';
import { TagModule } from '@/tag/tag.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { CrawlJobProcessor } from './crawl-job.processor';
import { MinioConnectModule } from '@common/connection/minio';

@Module({
  imports: [
    GoogleDriveApiModule,
    BullModule.registerQueue({
      name: ConstantBase.QUEUE_CRAWL_NAME,
    }),
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
