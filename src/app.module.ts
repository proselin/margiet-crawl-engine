import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Environment } from './environment';
import { envValidation } from './common';
import { CrawlConsumerModule } from '@crawl-engine/bull/consumers/craw-consumer';
import { CrawlProducerModule } from '@crawl-engine/bull/producers/crawl-producer';
import { MargietDbModule } from '@crawl-engine/database';
import { BullmqConnectModule } from '@crawl-engine/common/connection/bullmq';
import { PuppeteerModule } from 'nestjs-puppeteer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: () => envValidation(Environment),
    }),
    PuppeteerModule.forRoot({
      headless: true,
      channel: 'chrome',
      waitForInitialPage: true,
    }),
    BullmqConnectModule,
    CrawlConsumerModule,
    CrawlProducerModule,
    MargietDbModule,
  ],
})
export class AppModule {}
