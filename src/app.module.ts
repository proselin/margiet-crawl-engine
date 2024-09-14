import { CrawlConsumerModule } from '@/jobs/consumers/craw-consumer';
import { CrawlProducerModule } from '@/jobs/producers/crawl-producer';
import { BullmqConnectModule } from '@/common/connection/bullmq';
import { MargietDbModule } from '@/common/database';
import { CrawlModule } from '@/crawl';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { WinstonLoggerModule } from './common/logger/winston';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonLoggerModule,
    PuppeteerModule.forRoot({
      headless: 'new',
      devtools: true,
      channel: 'chrome',
      waitForInitialPage: true,
    }),
    BullmqConnectModule,
    CrawlConsumerModule,
    CrawlProducerModule,
    MargietDbModule,
    CrawlModule,
  ],
})
export class AppModule {}
