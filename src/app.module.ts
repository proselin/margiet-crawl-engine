import { CrawlConsumerModule } from '@/jobs/bullmq/consumers/craw-consumer';
import { CrawlProducerModule } from '@/jobs/bullmq/producers/crawl-producer';
import { BullmqConnectModule } from '@/connection/bullmq';
import { CrawlEngineDbModule } from 'src/connection/database';
import { CrawlModule } from '@/crawl';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { WinstonLoggerModule } from './common/logger/winston';
import { TerminusModule } from '@nestjs/terminus';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';
import { RefreshComicModule } from '@/cronjob/refresh-comic';
import { UploadDriveModule } from '@/jobs/bullmq/consumers/upload-drive';
import { RmqJobModule } from '@/jobs/rabbitmq/rmqJobModule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TerminusModule,
    WinstonLoggerModule,
    PuppeteerModule.forRoot({
      headless: 'new',
      waitForInitialPage: true,
      defaultViewport: null,
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox'],
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
