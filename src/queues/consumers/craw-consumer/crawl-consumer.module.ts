import { CrawlChapterService } from '@/queues/consumers/craw-consumer/services/crawl-chapter.service';
import { CrawlComicService } from '@/queues/consumers/craw-consumer/services/crawl-comic.service';
import { CrawlImageService } from '@/queues/consumers/craw-consumer/services/crawl-image.service';
import { CrawlUploadService } from '@/queues/consumers/craw-consumer/services/crawl-upload.service';
import { CrawlProducerModule } from '@/queues/producers/crawl-producer';
import { ChapterModule } from '@/entities/chapter/chapter.module';
import { ComicModule } from '@/entities/comic/comic.module';
import { ImageModule } from '@/entities/image/image.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CrawlJobProcessor } from './crawl-job.processor';
import { MinioConfigModule } from '@/config/minio';
import { QueueName } from '@/common';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.QUEUE_CRAWL_NAME,
    }),
    BullModule.registerQueue({
      name: QueueName.QUEUE_UPLOAD_NAME,
    }),
    BullModule.registerQueue({
      name: QueueName.QUEUE_SYNC_NAME,
    }),
    MinioConfigModule,
    CrawlProducerModule,

    ComicModule,
    ChapterModule,
    ImageModule,
  ],
  providers: [
    CrawlJobProcessor,
    CrawlImageService,
    CrawlComicService,
    CrawlUploadService,
    CrawlChapterService,
  ],
})
export class CrawlConsumerModule {}
