import { Module } from '@nestjs/common';
import { RmqProducerModule } from '@/jobs/rabbitmq/producer/rmq-producer.module';

@Module({
  imports: [RmqProducerModule],
})
export class RmqJobModule {}
