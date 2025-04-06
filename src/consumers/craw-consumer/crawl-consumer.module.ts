import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { QueueName } from "../../common";
import { CrawlProducerModule } from "../../producers/crawl-producer";
import { ComicModule } from "../../entities/comic";
import { ChapterModule } from "../../entities/chapter";
import { ImageModule } from "../../entities/image";
import { CrawlImageService } from "./services/crawl-image.service";
import { CrawlComicService } from "./services/crawl-comic.service";
import { UploadService } from "./services/upload.service";
import { CrawlChapterService } from "./services/crawl-chapter.service";
import { NettruyenHttpService } from "./services/nettruyen-http.service";
import { CrawlJobProcessor } from "./crawl-job.processor";
import { NettruyenExtractor } from "./extractor/nettruyen.extractor";

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.QUEUE_CRAWL,
    }),
    CrawlProducerModule,
    ComicModule,
    ChapterModule,
    ImageModule,
  ],
  providers: [
    CrawlJobProcessor,
    NettruyenHttpService,
    CrawlChapterService,
    CrawlImageService,
    UploadService,
    CrawlComicService,
    NettruyenExtractor,
  ],
})
export class CrawlConsumerModule {}
