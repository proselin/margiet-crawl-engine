import { Module } from '@nestjs/common';
import { CrawlProducerService } from './crawl-producer.service';
import { BullModule } from '@nestjs/bullmq';
import { Constant } from '@/utils/constant';

@Module({
  imports: [
    BullModule.registerQueue({
      name: Constant.QUEUE_CRAWL_NAME,
    }),
    BullModule.registerQueue({
      name: Constant.QUEUE_UPLOAD_NAME,
    }),
  ],
  providers: [CrawlProducerService],
  exports: [CrawlProducerService],
})
export class CrawlProducerModule {}
