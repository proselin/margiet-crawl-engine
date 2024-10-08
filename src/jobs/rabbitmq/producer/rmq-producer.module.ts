import { Module } from '@nestjs/common';
import { SyncComicRmqProducer } from '@/jobs/rabbitmq/producer/sync-comic-rmq.producer';
import { syncComicQueueConfiguration } from '@/jobs/rabbitmq/config/sync-comic-queue-client';
import { RmqModule } from '@/libs/rabbitmq';

@Module({
  imports: [RmqModule.registerAsync(syncComicQueueConfiguration)],
  providers: [SyncComicRmqProducer],
  exports: [SyncComicRmqProducer],
})
export class RmqProducerModule {}
