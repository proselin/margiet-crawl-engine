import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import bullmqConfig from '@/config/redis.config';

@Module({
  imports: [BullModule.forRootAsync(bullmqConfig.asProvider())],
  exports: [BullModule],
})
export class BullmqConfigModule {}
