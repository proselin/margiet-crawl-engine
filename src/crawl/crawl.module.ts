import { Module } from '@nestjs/common';
import { CrawlController } from './crawl.controller';
import { CrawlService } from './crawl.service';
import { CrawlProducerModule } from '@crawl-engine/bull/producers/crawl-producer';

@Module({
  imports: [CrawlProducerModule],
  controllers: [CrawlController],
  providers: [CrawlService],
  exports: [CrawlService],
})
export class CrawlModule {}
