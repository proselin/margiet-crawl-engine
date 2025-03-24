import { Module } from '@nestjs/common';

import { CrawlConsumerModule } from './queues/consumers/craw-consumer';
import { CrawlProducerModule } from './queues/producers/crawl-producer';
import { CrawlModule } from './crawl';
import { RefreshComicModule } from './cronjob/refresh-comic';
import { MinioModule } from '@libs/minio';

@Module({
  imports: [
    CrawlConsumerModule,
    CrawlProducerModule,
    CrawlModule,
    RefreshComicModule,
    MinioModule,
  ],
})
export class CrawlEngineModule {}
