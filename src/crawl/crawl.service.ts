import { CrawlProducerService } from '@/jobs/bullmq/producers/crawl-producer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);

  constructor(private producerService: CrawlProducerService) {}

  /**
   * @param href
   * @description Add a jobs crawl comic-fe to queue
   * @returns {Promise<void>}
   */
  async addCrawlComicJob(href: string): Promise<void> {
    return this.producerService.addCrawlComicJob(href).then(() => {});
  }

  /**
   * @description Update comic-fe by re crawl
   * @param comicId id of updated comic-fe
   * @param newUrl
   * @returns Job
   */
  async updateCrawlComicJob(
    comicId: string,
    newUrl: string | null,
  ): Promise<void> {
    return this.producerService
      .updateOneCrawlComicJob(comicId, newUrl)
      .then(() => {});
  }
}
