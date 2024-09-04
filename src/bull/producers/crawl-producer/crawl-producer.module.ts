import { Module } from '@nestjs/common';
import { CrawlProducerService } from './crawl-producer.service';
import { BullModule } from '@nestjs/bullmq';
import { ConstantBase } from '@/common/utils/constant.base';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ConstantBase.QUEUE_CRAWL_NAME,
    }),
    BullModule.registerQueue({
      name: ConstantBase.QUEUE_UPLOAD_NAME,
    }),
  ],
  providers: [CrawlProducerService],
  exports: [CrawlProducerService],
})
export class CrawlProducerModule {}
