import { Module } from '@nestjs/common';
import { RedisConfig } from '@/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: RedisConfig.config(process.env),
    }),
  ],
  exports: [BullModule],
})
export class BullmqConnectModule {}
