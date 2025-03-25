import { Module } from '@nestjs/common';

import { CrawlConsumerModule } from './queues/consumers';
import { CrawlProducerModule } from './queues/producers';
import { RefreshComicModule } from './cronjob/refresh-comic';
import { DomainsModule } from './domains/domains.module';

@Module({
  imports: [
    CrawlConsumerModule,
    CrawlProducerModule,
    RefreshComicModule,
    DomainsModule
  ],
})
export class CrawlEngineModule {}
