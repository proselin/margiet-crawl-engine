import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";

import { ComicEntity } from "../../entities/comic";
import { CrawlProducerService } from "../../producers/crawl-producer";

@Injectable()
export class RefreshComicService {
  private readonly logger = new Logger(RefreshComicService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private crawlProducerService: CrawlProducerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  public async runTaskUpdateComic() {
    this.logger.log(`${this.runTaskUpdateComic.name}|:== Time to refresh comic !!`);

    // Calculate the date for 1 day ago
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Query the collection

    const entities = await this.comicRepository.findBy({
      shouldRefresh: true,
      updatedAt: MoreThan(oneDayAgo),
    });

    return this.crawlProducerService.updateCrawlComicJob(entities.map(comic => comic.id));
  }
}
