import { Module } from '@nestjs/common';
import { WinstonLoggerModule } from '@/logger/winston';
import { envValidation } from '@/config';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { BullmqConnectModule } from '@/connection/bullmq';
import { CrawlConsumerModule } from '@/jobs/bullmq/consumers/craw-consumer';
import { CrawlProducerModule } from '@/jobs/bullmq/producers/crawl-producer';
import { DatabaseModule } from '@/connection/database';
import { CrawlModule } from '@/crawl';
import { RefreshComicModule } from '@/cronjob/refresh-comic';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
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
