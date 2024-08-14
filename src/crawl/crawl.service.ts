import { CrawlProducerService } from '@crawl-engine/bull/producers/crawl-producer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CrawlService {
  private logger = new Logger(CrawlService.name);

  constructor(private crawlProducerService: CrawlProducerService) {}

  handleCrawlEvent(href: string) {
    return this.crawlProducerService.addCrawlComicJob(href);
  }
}
