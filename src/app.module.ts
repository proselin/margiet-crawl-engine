import { CrawlConsumerModule } from '@/jobs/consumers/craw-consumer';
import { CrawlProducerModule } from '@/jobs/producers/crawl-producer';
import { BullmqConnectModule } from '@/common/connection/bullmq';
import { CrawlEngineDbModule } from '@/common/database';
import { CrawlModule } from '@/crawl';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { WinstonLoggerModule } from './common/logger/winston';
import { TerminusModule } from '@nestjs/terminus';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';
import { RefreshComicModule } from '@/cronjob/refresh-comic';
import { UploadDriveModule } from '@/jobs/consumers/upload-drive';
import { RmqJobModule } from '@/rabbitmq/rmqJobModule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TerminusModule,
    WinstonLoggerModule,
    PuppeteerModule.forRoot({
      headless: 'new',
      devtools: true,
      waitForInitialPage: true,
    }),
    BullmqConnectModule,
    RmqJobModule,
    CrawlConsumerModule,
    CrawlProducerModule,
    CrawlEngineDbModule,
    CrawlModule,
    MetricsModule,
    HealthModule,
    RefreshComicModule,
    UploadDriveModule,
  ],
})
export class AppModule {}
