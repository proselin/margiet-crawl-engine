import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidation } from './config';
import redisConfig from './config/redis.config';
import databaseConfig from './config/database/database.config';
import { LoggerConfigModule } from './config/logger';
import { BullmqConfigModule } from './config/bullmq';
import { DatabaseConfigModule } from './config/database';
import { CrawlConsumerModule } from './queues/consumers/craw-consumer';
import { CrawlProducerModule } from './queues/producers/crawl-producer';
import { CrawlModule } from './crawl';
import { RefreshComicModule } from './cronjob/refresh-comic';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
      load: [redisConfig, databaseConfig],
    }),
    LoggerConfigModule,
    // PuppeteerConfigModule,
    BullmqConfigModule,
    DatabaseConfigModule,
    CrawlConsumerModule,
    CrawlProducerModule,
    CrawlModule,
    RefreshComicModule,
  ],
})
export class AppModule {
  constructor() {}
}
