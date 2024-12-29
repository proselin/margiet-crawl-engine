import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CrawlJobProcessor } from './crawl-job.processor';
import { QueueName } from '../../../common';
import { MinioConfigModule } from '../../../config/minio';
import { CrawlProducerModule } from '../../producers/crawl-producer';
import { ComicModule } from '../../../entities/comic';
import { ChapterModule } from '../../../entities/chapter';
import { ImageModule } from '../../../entities/image';
import { CrawlImageService } from './services/crawl-image.service';
import { CrawlComicService } from './services/crawl-comic.service';
import { CrawlUploadService } from './services/crawl-upload.service';
import { CrawlChapterService } from './services/crawl-chapter.service';

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
