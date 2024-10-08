import { ClientRMQ, ReadPacket, RmqRecord } from '@nestjs/microservices';
import { Channel } from 'amqplib';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { PublishOptions } from 'amqp-connection-manager/dist/types/ChannelWrapper';
import { IBindingConfig, IExchangeConfig, IRmqOptions } from '@/libs/rabbitmq/type/rmq.options';
import { PublishPattern, RmqReadPacket, RmqWritePacket, SendToQueuePattern } from '@/libs/rabbitmq/type/rmq.packet';

export class RmqClient extends ClientRMQ {
  private exchanges: Map<string, IExchangeConfig>;
  private readonly bindings: IBindingConfig[];

  constructor(rmqOptions: IRmqOptions) {
    try {
      const more = rmqOptions.extends;
      delete rmqOptions.extends

      super(rmqOptions);

      this.exchanges = new Map();
      this.bindings = more.bindings;

      for (const exchange of more.exchanges) {
        this.exchanges.set(exchange.name, exchange);
      }
    }catch (e) {
      super({})
      this.logger.error(e);
    }

  }

  async setupChannel(channel: Channel, callback: () => void) {
    try {
      await this.setupExchanges(channel)
      await this.setupBindings(channel)
      callback();
    }catch (error) {
      this.logger.error("Setup channel error::", error)
    }
  }

  protected publish(
    packet: RmqReadPacket,
    callback: (packet: RmqWritePacket) => void,
    options?: PublishOptions,
  ): () => void {
    
    switch (packet.pattern.type) {
      case 'publish': {
        return this.doPublish(packet, callback, options);
      }
      default:
      case 'sendToQueue':{
        const pattern = (packet.pattern as SendToQueuePattern).message
        return this.sendToQueue({
          pattern,
          data: packet.data
        }, callback)
      }
    }
  }

  private doPublish(
    packet: RmqReadPacket,
    callback: (packet: RmqWritePacket) => void,
    options?: PublishOptions,
  ) {
    const { exchange, routingKey } = packet.pattern as PublishPattern;

    if (!this.exchanges.has(exchange)) {
      callback({
        err: new Error(`Exchange ${exchange} is not configured`),
        response: null,
        isDisposed: true,
      });
      return () => {};
    }

    try {
      callback({ err: null, response: null });
    } catch (error) {}
    try {
      const correlationId = randomStringGenerator();
      const listener = ({
                          content,
                          options,
                        }: {
        content: Buffer;
        options: Record<string, unknown>;
      }) =>
        this.handleMessage(
          this.parseMessageContent(content),
          options,
          callback,
        );

      Object.assign(packet, { id: correlationId });
      const serializedPacket: RmqReadPacket & Partial<RmqRecord> =
        this.serializer.serialize(packet);
      const publishOptions = options ?? serializedPacket.options;
      delete serializedPacket.options;
      this.responseEmitter.on(correlationId, listener);
      this.channel
        .publish(
          exchange,
          routingKey,
          Buffer.from(JSON.stringify(serializedPacket)),
          {
            replyTo: this.replyQueue,
            persistent: this.persistent,
            ...publishOptions,
            headers: this.mergeHeaders(publishOptions?.headers),
            correlationId,
          },
        )
        .catch((err) => callback({ err, response: null }));
      return () => this.responseEmitter.removeListener(correlationId, listener);
    } catch (err) {
      callback({ err, response: null });
    }
  }

  protected sendToQueue(
    message: ReadPacket,
    callback: (packet: RmqWritePacket) => void,
  ) {
    return super.publish(message, callback);
  }

  protected async dispatchEvent<T = any>(packet: RmqReadPacket): Promise<T> {
    const { pattern, data } = packet;
    const content = Buffer.from(JSON.stringify(data));

    switch (pattern.type) {
      case "sendToQueue":
      default: {
        const pattern = (packet.pattern as SendToQueuePattern).message
        await super.dispatchEvent({
          pattern, data
        })
        break
      }
      case "publish": {
        const { exchange, routingKey } = pattern as PublishPattern;
        if (!this.exchanges.has(exchange)) {
          throw new Error(`Exchange ${exchange} is not configured`);
        }
        await this.channel.publish(exchange, routingKey, content, { persistent: true });
        break;
      }

    }
    return;
  }

  private async setupExchanges(channel: Channel) {
    for (const exchange of this.exchanges.values()) {
      await channel.assertExchange(
        exchange.name,
        exchange.type,
        exchange.options,
      );
    }
  }

  private async setupBindings(channel: Channel) {
    for (const binding of this.bindings) {
      const exchange = this.exchanges.get(binding.exchange);

      if (!exchange) {
        throw new Error(`Exchange ${binding.exchange} not found`);
      }

      for (const routingKey of binding.routingKeys) {
        await channel.bindQueue(this.options.queue, exchange.name, routingKey);
      }
    }
  }
}
