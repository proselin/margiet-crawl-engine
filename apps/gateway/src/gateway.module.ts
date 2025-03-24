import { Module } from '@nestjs/common';
import { ConfigModule } from '@libs/config/config.module';
import { BullmqConfigModule } from '@libs/bullmq';
import { DatabaseConfigModule } from '@libs/database';
import { HttpModule } from '@libs/http';
import { LoggerConfigModule } from '@libs/logger';
import { CrawlEngineModule } from '@modules/crawl-engine';

@Module({
  imports: [
    ConfigModule,
    LoggerConfigModule,
    BullmqConfigModule,
    DatabaseConfigModule,
    HttpModule,
    CrawlEngineModule,
  ],
})
export class GatewayModule {}
