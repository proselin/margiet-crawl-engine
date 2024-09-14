import { CrawlProducerService } from '@/jobs/producers/crawl-producer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);

  constructor(private producerService: CrawlProducerService) {}

  /**
   * @param href
   * @description Add a job crawl comic to queue
   * @returns {Promise<void>}
   */
  async addCrawlComicJob(href: string): Promise<void> {
    return this.producerService.addCrawlComicJob(href).then(() => {});
  }

  /**
   * @description Update comic by re crawl
   * @param comicId id of updated comic
   * @param newUrl
   * @returns Job
   */
  async updateCrawlComicJob(
    comicId: string,
    newUrl: string | null,
  ): Promise<void> {
    return this.updateCrawlComicJob(comicId, newUrl).then(() => {});
  }

  async addSyncChapterJob(chapterId: string): Promise<void> {
    this.producerService.addSyncChapterJob(chapterId).then(() => {});
  }
}
