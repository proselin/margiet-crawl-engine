import { Module } from '@nestjs/common';
import { ConfigAppModule } from '@shared/config/config-app.module';
import { BullmqConfigModule } from '@shared/bullmq';
import { DatabaseConfigModule } from '@shared/database';
import { HttpConfigModule } from '@shared/http';
import { LoggerConfigModule } from '@shared/logger';
import { CrawlEngineModule } from '@modules/crawl-engine';
import { LoggingInterceptor, TimeoutInterceptor } from '@shared/common';
import { CsrfMiddleware } from '@shared/middlewares';
import { GraphQLConfigModule } from '@shared/graphql/plugins';
import { CacheConfigModule } from '@shared/cache';
import { CoreModule } from '@modules/core';

@Module({
  imports: [
    ConfigAppModule,
    LoggerConfigModule,
    // BullmqConfigModule,
    DatabaseConfigModule,
    HttpConfigModule,
    GraphQLConfigModule,
    CacheConfigModule,
    // CrawlEngineModule,
    CoreModule
  ],
  providers: [TimeoutInterceptor, LoggingInterceptor, CsrfMiddleware],
})
export class GatewayModule {}
