import { CrawlProducerModule } from '@/jobs/bullmq/producers/crawl-producer';
import { Module } from '@nestjs/common';
import { CrawlController } from './crawl.controller';
import { CrawlService } from './crawl.service';

@Module({
  imports: [CrawlProducerModule],
  controllers: [CrawlController],
  providers: [CrawlService],
})
export class CrawlModule {}
