import { Module } from '@nestjs/common';

import { CrawlController } from './crawl.controller';
import { CrawlService } from './crawl.service';
import { CrawlProducerModule } from '../queues/producers/crawl-producer';

@Module({
  imports: [CrawlProducerModule],
  controllers: [CrawlController],
  providers: [CrawlService],
})
export class CrawlModule {}
