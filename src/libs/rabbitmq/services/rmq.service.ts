import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RmqClient } from '@libs/rabbitmq/class/rmq-client';
import { IRmqOptions } from '@libs/rabbitmq/type/rmq.options';
import { firstValueFrom } from 'rxjs';
import { PublishPattern, SendToQueuePattern } from '@libs/rabbitmq/type/rmq.packet';

@Injectable()
export class RmqService implements OnModuleInit, OnModuleDestroy {
  public client: RmqClient;

  constructor(public rmqOptions: IRmqOptions) {
    this.client = new RmqClient(rmqOptions);
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    this.client.close();
  }

  async emitToQueue(message: string, data: any) {
    const pattern: SendToQueuePattern = { message, type: 'sendToQueue' };
    return firstValueFrom(this.client.emit(pattern, data));
  }

  async emitByPublish(exchange: string, routingKey: string, data: any) {
    const pattern: PublishPattern = {
      exchange,
      routingKey,
      type: 'publish',
    }
    return firstValueFrom(this.client.emit(pattern, data))
  }

  async sendByPublish(exchange: string, routingKey: string, data: any) {
    const pattern: PublishPattern = {
      exchange,
      routingKey,
      type: 'publish',
    }
    return firstValueFrom(this.client.send(pattern, data))
  }

  async sendToQueue(message: string, data: any){
    const pattern: SendToQueuePattern = { message, type: 'sendToQueue' };
    return firstValueFrom(this.client.send(pattern, data));
  }
}
