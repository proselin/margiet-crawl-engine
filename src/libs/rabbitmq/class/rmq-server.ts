// custom-rmq.server.ts
import { ServerRMQ } from '@nestjs/microservices';
import { Channel } from 'amqplib';
import { IBindingConfig, IExchangeConfig, IRmqOptions } from '@/libs/rabbitmq/type/rmq.options';

export class RmqServer extends ServerRMQ {
  private exchanges: Map<string, IExchangeConfig>;
  private readonly bindings: IBindingConfig[];

  constructor(protected readonly options: IRmqOptions) {
    super(options);
    this.exchanges = new Map();
    this.bindings = options.extends.bindings;

    for (const exchange of options.extends.exchanges) {
      this.exchanges.set(exchange.name, exchange);
    }
  }

  async setupChannel(channel: Channel, callback: () => void) {
    await this.setupExchanges(channel);
    await this.setupBindings(channel);
    callback();
  }

  private async setupExchanges(channel: Channel) {
    for (const exchange of this.exchanges.values()) {
      await channel.assertExchange(exchange.name, exchange.type, exchange.options);
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
