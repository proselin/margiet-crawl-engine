import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Environment } from './environment';
import { envValidation } from './common';
import { CrawlConsumerModule } from '@crawl-engine/bull/consumers/craw-consumer';
import { CrawlProducerModule } from '@crawl-engine/bull/producers/crawl-producer';
import { MargietDbModule } from '@crawl-engine/database';
import { BullmqConnectModule } from '@crawl-engine/common/connection/bullmq';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { CrawlModule } from '@crawl-engine/crawl';
import { LoggerModule } from 'nestjs-pino';

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
    PuppeteerModule.forRootAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (_: ConfigService) => {
        return {
          headless: false,
          devtools: true,
          channel: 'chrome',
          waitForInitialPage: true,
        };
      },
    }),
    BullmqConnectModule,
    CrawlConsumerModule,
    CrawlProducerModule,
    MargietDbModule,
    CrawlModule,
  ],
})
export class AppModule {}
