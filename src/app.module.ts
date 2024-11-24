import { Module } from '@nestjs/common';
import { WinstonLoggerModule } from '@/logger/winston';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { BullmqConnectModule } from 'src/config/bullmq';
import { CrawlConsumerModule } from '@/queues/consumers/craw-consumer';
import { CrawlProducerModule } from '@/queues/producers/crawl-producer';
import { DatabaseModule } from 'src/config/database';
import { CrawlModule } from '@/crawl';
import { RefreshComicModule } from '@/cronjob/refresh-comic';
import { envValidation } from '@/config';
import redisConfig from '@/config/redis.config';
import bullmqConfig from '@/config/bullmq.config';
import databaseConfig from '@/config/database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: envValidation,
      load: [redisConfig, bullmqConfig, databaseConfig],
    }),
    WinstonLoggerModule,
    PuppeteerModule.forRoot({
      headless: 'new',
      waitForInitialPage: true,
      defaultViewport: null,
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox'],
    }),
    BullmqConnectModule,
    CrawlConsumerModule,
    CrawlProducerModule,
    DatabaseModule,
    CrawlModule,
    RefreshComicModule,
  ],
})
export class AppModule {}
