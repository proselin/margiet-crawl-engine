import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CrawlDto } from '@crawl-engine/crawl/dto/crawl.dto';
import { CrawlService } from '@crawl-engine/crawl/crawl.service';

@Controller()
export class CrawlController {
  private logger = new Logger(CrawlController.name);

  constructor(private crawlService: CrawlService) {}

  @EventPattern('Crawl')
  crawlByData(@Payload() crawlDto: CrawlDto) {
    this.logger.log('Trigger Crawl Event >> ' + JSON.stringify(crawlDto));
    return this.crawlService.handleCrawlEvent(crawlDto.href);
  }
}
