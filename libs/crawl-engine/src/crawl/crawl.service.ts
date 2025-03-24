import { Injectable, Logger } from '@nestjs/common';
import { CrawlProducerService } from '../queues/producers/crawl-producer';

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);

  constructor(private producerService: CrawlProducerService) {}

  /**
   * @param href
   * @description Add a queues crawl comic-fe to queue
   * @returns {Promise<void>}
   */
  async addCrawlComicJob(href: string): Promise<any> {
    this.logger.log(`Add crawl comic job to the queue! >>`);
    return this.producerService.addCrawlComicJob(href);
  }

  /**
   * @description Update comic-fe by re crawl
   * @param comicId id of updated comic-fe
   * @param newUrl
   * @returns Job
   */
  async updateCrawlComicJob(
    comicId: number,
    newUrl: string | null,
  ): Promise<any> {
    return this.producerService.updateOneCrawlComicJob(comicId, newUrl);
  }
}
