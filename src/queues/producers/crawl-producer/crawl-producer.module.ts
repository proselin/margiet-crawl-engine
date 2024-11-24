import { Module } from '@nestjs/common';
import { CrawlProducerService } from './crawl-producer.service';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@/common';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.QUEUE_CRAWL_NAME,
    }),
    BullModule.registerQueue({
      name: QueueName.QUEUE_UPLOAD_NAME,
    }),
    BullModule.registerQueue({
      name: QueueName.QUEUE_SYNC_NAME,
    }),
  ],
  providers: [CrawlProducerService],
  exports: [CrawlProducerService],
})
export class CrawlProducerModule {}
