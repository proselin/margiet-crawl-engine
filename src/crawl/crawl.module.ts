import { Module } from '@nestjs/common';
import { CrawlController } from './crawl.controller';
import { CrawlService } from './crawl.service';
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
  controllers: [CrawlController],
  providers: [CrawlService],
})
export class CrawlModule {}
