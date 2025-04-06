import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerConfigModule } from "./config/logger";
import { BullmqConfigModule } from "./config/bullmq";
import { DatabaseConfigModule } from "./config/database";
import { CrawlConsumerModule } from "./consumers/craw-consumer";
import { CrawlProducerModule } from "./producers/crawl-producer";
import { CrawlModule } from "./crawl";
import { RefreshComicModule } from "./cronjob/refresh-comic";
import { HttpModule } from "@nestjs/axios";
import { envValidation } from "./config/env";
import { GoogleDriveConfigModule } from "./config/google-drive";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
    }),
    HttpModule.register({
      global: true,
    }),

    LoggerConfigModule,
    BullmqConfigModule,
    DatabaseConfigModule,
    CrawlConsumerModule,
    CrawlProducerModule,
    CrawlModule,
    RefreshComicModule,
    GoogleDriveConfigModule,
  ],
})
export class AppModule {
  constructor() {}
}
