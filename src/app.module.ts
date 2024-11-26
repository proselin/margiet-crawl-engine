import { Module } from '@nestjs/common';
import { LoggerConfigModule } from 'src/config/logger';
import { ConfigModule } from '@nestjs/config';
import { BullmqConfigModule } from 'src/config/bullmq';
import { CrawlConsumerModule } from '@/queues/consumers/craw-consumer';
import { CrawlProducerModule } from '@/queues/producers/crawl-producer';
import { DatabaseConfigModule } from 'src/config/database';
import { CrawlModule } from '@/crawl';
import { RefreshComicModule } from '@/cronjob/refresh-comic';
import { envValidation } from '@/config';
import redisConfig from '@/config/redis.config';
import databaseConfig from '@/config/database/database.config';
import { PuppeteerConfigModule } from '@/config/pupeteer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
      load: [redisConfig, databaseConfig],
    }),
    LoggerConfigModule,
    PuppeteerConfigModule,
    BullmqConfigModule,
    DatabaseConfigModule,
    CrawlConsumerModule,
    CrawlProducerModule,
    CrawlModule,
    RefreshComicModule,
  ],
})
export class AppModule {}
