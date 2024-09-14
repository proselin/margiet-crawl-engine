import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrawlProducerService } from '@/jobs/producers/crawl-producer';
import { ConfigService } from '@nestjs/config';
import { ComicService } from '@/comic/comic.service';
import { ComicDocument } from '@/comic/comic.schema';

@Injectable()
export class RefreshComicService {
  private readonly logger = new Logger(RefreshComicService.name);

  constructor(
    private comicService: ComicService,
    private configService: ConfigService,
    private crawlProducerService: CrawlProducerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  public async runTaskUpdateComic() {
    this.logger.log(
      `${this.runTaskUpdateComic.name}|:== Time to refresh comic !!`,
    );

    // Calculate the date for 1 day ago
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Query the collection

    const comicDocuments = await this.comicService.model
      .find<ComicDocument>({
        should_refresh: true,
        is_current_url_is_notfound: false,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        updatedAt: { $lt: oneDayAgo },
      })
      .exec();

    return this.crawlProducerService.updateCrawlComicJob(
      comicDocuments.map((comic) => comic.id),
    );
  }
}
