import { CrawlConsumerModule } from '@/bull/consumers/craw-consumer';
import { CrawlProducerModule } from '@/bull/producers/crawl-producer';
import { CrawlModule } from '@/crawl';
import { MargietDbModule } from '@/database';
import { BullmqConnectModule } from '@common/connection/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { envValidation } from './common';
import { WinstonLoggerModule } from './common/logger/winston';
import { Environment } from './environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: () => envValidation(Environment),
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
