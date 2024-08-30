import { CrawlConsumerModule } from '@crawl-engine/bull/consumers/craw-consumer';
import { CrawlProducerModule } from '@crawl-engine/bull/producers/crawl-producer';
import { BullmqConnectModule } from '@crawl-engine/common/connection/bullmq';
import { CrawlModule } from '@crawl-engine/crawl';
import { MargietDbModule } from '@crawl-engine/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { envValidation } from './common';
import { Environment } from './environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: () => envValidation(Environment),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    PuppeteerModule.forRoot({
      headless: false,
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
