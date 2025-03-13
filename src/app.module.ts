import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerConfigModule } from './config/logger';
import { BullmqConfigModule } from './config/bullmq';
import { DatabaseConfigModule } from './config/database';
import { CrawlConsumerModule } from './queues/consumers/craw-consumer';
import { CrawlProducerModule } from './queues/producers/crawl-producer';
import { CrawlModule } from './crawl';
import { RefreshComicModule } from './cronjob/refresh-comic';
import { HttpModule } from '@nestjs/axios';
import { envValidation } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
    }),
    LoggerConfigModule,
    BullmqConfigModule,
    DatabaseConfigModule,
    CrawlConsumerModule,
    CrawlProducerModule,
    CrawlModule,
    RefreshComicModule,
    HttpModule.register({
      global: true
    }),
  ],
})
export class AppModule {
  constructor() {}
}
