import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { QueueOptions } from "bullmq";

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            host: configService.getOrThrow("redis.host"),
            port: +configService.getOrThrow("redis.port"),
          },
        } as QueueOptions;
      },
    }),
  ],
  exports: [BullModule],
})
export class BullmqConfigModule {}
