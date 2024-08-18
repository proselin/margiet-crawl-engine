import { ChapterModule } from '@crawl-engine/chapter/chapter.module';
import { GoogleDriveApiModule } from '@crawl-engine/common/connection/google-drive-api';
import { ImageModule } from '@crawl-engine/image/image.module';
import { Module } from '@nestjs/common';
import { CrawlChapterService } from './crawl-chapter.service';
import { CrawlJobProcessor } from './crawl-job.processor';
import { AuthorModule } from '@crawl-engine/author/author.module';
import { ComicModule } from '@crawl-engine/comic/comic.module';
import { StatusModule } from '@crawl-engine/status/status.module';
import { TagModule } from '@crawl-engine/tag/tag.module';
import { BullModule } from '@nestjs/bullmq';
import { ConstantBase } from '@crawl-engine/common/utils/constant.base';
import { CrawlImageService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-image.service';
import { CrawlComicService } from '@crawl-engine/bull/consumers/craw-consumer/crawl-comic.service';
import { CrawlProducerModule } from '@crawl-engine/bull/producers/crawl-producer';
import { PuppeteerModule } from 'nestjs-puppeteer';

@Module({
  imports: [
    GoogleDriveApiModule,
    BullModule.registerQueue({
      name: ConstantBase.QUEUE_CRAWL_NAME,
    }),
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
    CrawlChapterService,
    CrawlImageService,
    CrawlComicService,
  ],
})
export class CrawlConsumerModule {}
