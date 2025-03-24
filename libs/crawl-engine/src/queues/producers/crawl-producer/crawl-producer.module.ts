import { Module } from '@nestjs/common';
import { CrawlProducerService } from './crawl-producer.service';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAME } from '@libs/common';

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
  ],
  providers: [CrawlProducerService],
  exports: [CrawlProducerService],
})
export class CrawlProducerModule {}
