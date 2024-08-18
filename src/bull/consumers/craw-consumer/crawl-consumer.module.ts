import { AuthorModule } from '@crawl-engine/author/author.module';
import { CrawlComicService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-comic.service';
import { CrawlImageService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-image.service';
import { CrawlProducerModule } from '@crawl-engine/bull/producers/crawl-producer';
import { JobConstant } from '@crawl-engine/bull/shared';
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
import { CrawlChapterService } from './crawl-chapter.service';
import { CrawlJobProcessor } from './crawl-job.processor';

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
    CrawlChapterService,
    CrawlImageService,
    CrawlComicService,
  ],
})
export class CrawlConsumerModule {}
