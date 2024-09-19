import { CrawlConsumerModule } from '@/jobs/consumers/craw-consumer';
import { CrawlProducerModule } from '@/jobs/producers/crawl-producer';
import { BullmqConnectModule } from '@/common/connection/bullmq';
import { MargietDbModule } from '@/common/database';
import { CrawlModule } from '@/crawl';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { WinstonLoggerModule } from './common/logger/winston';
import { TerminusModule } from '@nestjs/terminus';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';

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
    CrawlConsumerModule,
    CrawlProducerModule,
    MargietDbModule,
    CrawlModule,
    MetricsModule,
    HealthModule,
  ],
})
export class AppModule {}
