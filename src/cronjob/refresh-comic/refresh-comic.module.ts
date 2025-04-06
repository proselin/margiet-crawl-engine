import { Module } from "@nestjs/common";

import { RefreshComicService } from "./refresh-comic.service";
import { CrawlProducerModule } from "../../producers/crawl-producer";
import { ComicModule } from "../../entities/comic";

@Module({
  imports: [CrawlProducerModule, ComicModule],
  providers: [RefreshComicService],
  exports: [RefreshComicService],
})
export class RefreshComicModule {}
