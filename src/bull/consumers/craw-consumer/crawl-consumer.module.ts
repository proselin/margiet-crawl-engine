import { AuthorModule } from '@crawl-engine/author/author.module';
import { CrawlChapterService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-chapter.service';
import { CrawlComicService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-comic.service';
import { CrawlImageService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-image.service';
import { CrawlUploadService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-upload.service';
import { CrawlProducerModule } from '@crawl-engine/bull/producers/crawl-producer';
import { ChapterModule } from '@crawl-engine/chapter/chapter.module';
import { ComicModule } from '@crawl-engine/comic/comic.module';
import { GoogleDriveApiModule } from '@crawl-engine/common/connection/google-drive-api';
import { ConstantBase } from '@crawl-engine/common/utils/constant.base';
import { ImageModule } from '@crawl-engine/image/image.module';
import { StatusModule } from '@crawl-engine/status/status.module';
import { TagModule } from '@crawl-engine/tag/tag.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { CrawlJobProcessor } from './crawl-job.processor';
import { JobConstant } from '@crawl-engine/bull/shared';

@Module({
  imports: [
    GoogleDriveApiModule,
    BullModule.registerQueue({
      name: ConstantBase.QUEUE_CRAWL_NAME,
    }),
    PuppeteerModule.forFeature([JobConstant.CRAWL_IMAGE_PAGE_NAME]),
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
