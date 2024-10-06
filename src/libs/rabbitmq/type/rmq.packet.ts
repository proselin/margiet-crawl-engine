import { ReadPacket, WritePacket } from '@nestjs/microservices';

export interface RmqReadPacket<T = any> extends ReadPacket<T> {
  pattern:  PublishPattern | SendToQueuePattern ;
}

export interface PublishPattern {
  exchange: string;
  routingKey: string;
  type: 'publish'
}

export interface SendToQueuePattern {
  type: 'sendToQueue',
  message: string;
}

export interface RmqWritePacket<T = any> extends WritePacket<T> {}
