import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Environment } from './environment';
import { envValidation } from './common';
import { CrawlConsumerModule } from '@crawl-engine/bull/consumers/craw-consumer';
import { CrawlProducerModule } from '@crawl-engine/bull/producers/crawl-producer';
import { CrawlModule } from '@crawl-engine/crawl/crawl.module';
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
      headless: false,
      executablePath: '/usr/bin/google-chrome-stable',
      channel: 'chrome',
      waitForInitialPage: true,
    }),
    BullmqConnectModule,
    CrawlConsumerModule,
    CrawlProducerModule,
    CrawlModule,
    MargietDbModule,
  ],
})
export class AppModule {}
