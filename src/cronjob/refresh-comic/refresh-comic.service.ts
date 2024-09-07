import { Injectable, Logger } from '@nestjs/common';
import { CronExpression, Cron } from '@nestjs/schedule';
import { CrawlProducerService } from '@/bull/producers/crawl-producer';
import { ConfigService } from '@nestjs/config';
import { ComicService } from '@/comic/comic.service';

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
    const comicDocuments = await this.comicService.model.find({
      updatedAt: { $lt: oneDayAgo },
    }).exec();

    Promise.all(comicDocuments.map((comic) => {
        return  
    }))



  }
}
