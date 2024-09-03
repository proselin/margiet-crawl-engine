import { CrawlConsumerModule } from '@crawl-engine/bull/consumers/craw-consumer';
import { CrawlProducerModule } from '@crawl-engine/bull/producers/crawl-producer';
import { BullmqConnectModule } from '@crawl-engine/common/connection/bullmq';
import { CrawlModule } from '@crawl-engine/crawl';
import { MargietDbModule } from '@crawl-engine/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { envValidation } from './common';
import { Environment } from './environment';
import { WinstonLoggerModule } from './common/logger/winston';
import { MinioConnectModule } from '@crawl-engine/common/connection/minio';

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
