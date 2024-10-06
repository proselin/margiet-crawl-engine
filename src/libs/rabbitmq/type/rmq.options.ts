import { RmqOptions } from '@nestjs/microservices';
import * as amqp from 'amqp-connection-manager';

/**
 *
 * @example
 * // rmq-options.ts
 * export const rmqOptions: CustomRmqOptions = {
 *   transport: Transport.RMQ,
 *   options: {
 *     urls: ['amqp://localhost'],
 *     exchanges: [
 *       {
 *         name: 'exchange1',
 *         type: 'topic',
 *         options: { durable: true },
 *       },
 *       {
 *         name: 'exchange2',
 *         type: 'direct',
 *         options: { durable: true },
 *       },
 *       // Add more exchanges as needed
 *     ],
 *     queue: {
 *       name: 'my_queue',
 *       options: { durable: true },
 *     },
 *     bindings: [
 *       {
 *         exchange: 'exchange1',
 *         routingKeys: ['key1.#'],
 *       },
 *       {
 *         exchange: 'exchange2',
 *         routingKeys: ['key2', 'key3'],
 *       },
 *       // Add more bindings as needed
 *     ],
 *   },
 * };
 */
export interface IExchangeConfig {
  name: string;
  type: string;
  options?:  amqp.Options.AssertExchange
}

export interface IBindingConfig {
  exchange: string;
  routingKeys: string[];
}

type RmqTransportOpts = RmqOptions['options']

export interface IRmqOptions extends RmqTransportOpts {
   extends?: {
     exchanges?: IExchangeConfig[];
     bindings?: IBindingConfig[];
   }
}