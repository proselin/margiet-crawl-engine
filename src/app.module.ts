import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NODE_ENV } from './common';
import { configDotenv } from 'dotenv';
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

function loadEnv() {
  switch (process.env.NODE_ENV) {
    case NODE_ENV.PRODUCTION: {
      configDotenv({
        path: '.env.prod',
      });
    }
    case NODE_ENV.DEVELOPMENT:
    default: {
      configDotenv({
        path: '.env.local',
      });
    }
  }
}

loadEnv();

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
