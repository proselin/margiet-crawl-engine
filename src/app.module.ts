import { CrawlConsumerModule } from '@/jobs/bullmq/consumers/craw-consumer';
import { CrawlProducerModule } from '@/jobs/bullmq/producers/crawl-producer';
import { BullmqConnectModule } from '@/connection/bullmq';
import { CrawlEngineDbModule } from 'src/connection/database';
import { CrawlModule } from '@/crawl';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { WinstonLoggerModule } from '@/logger/winston';
import { TerminusModule } from '@nestjs/terminus';
import { HealthModule } from './health/health.module';
import { RefreshComicModule } from '@/cronjob/refresh-comic';
import { envValidation } from '@/config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
    }),
    WinstonLoggerModule,
    TerminusModule,
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
    CrawlEngineDbModule,
    CrawlModule,
    HealthModule,
    RefreshComicModule,
  ],
})
export class AppModule {}
