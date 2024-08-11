import { Module } from '@nestjs/common';
import { CrawlJobProcessor } from './crawl-job.processor';
import { CrawlConsumerService } from './crawl-consumer.service';
import { BullModule } from '@nestjs/bullmq';
import { ConstantBase } from '@crawl-engine/common/utils/constant.base';
import { ImageModule } from '@crawl-engine/image/image.module';
import { ChapterModule } from '@crawl-engine/chapter/chapter.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ConstantBase.QUEUE_CRAWL_NAME,
    }),
    ImageModule,
    ChapterModule
  ],
  providers: [CrawlJobProcessor, CrawlConsumerService],
})
export class CrawlConsumerModule {}
