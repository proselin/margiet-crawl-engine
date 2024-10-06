import { Module } from '@nestjs/common';
import { RmqModule } from '@libs/rabbitmq/rmq.module';
import { SyncComicRmqProducer } from '@/rabbitmq/producer/sync-comic-rmq.producer';
import { syncComicQueueConfiguration } from '@/rabbitmq/config/sync-comic-queue-client';

@Module({
  imports: [RmqModule.registerAsync(syncComicQueueConfiguration)],
  providers: [SyncComicRmqProducer],
  exports: [SyncComicRmqProducer],
})
export class RmqProducerModule {}
