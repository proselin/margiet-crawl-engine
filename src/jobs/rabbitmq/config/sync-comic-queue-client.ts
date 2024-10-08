import { ConfigService } from '@nestjs/config';
import { RmqModule } from '@/libs/rabbitmq';
import { IRmqOptions } from '@/libs/rabbitmq/type/rmq.options';

export const syncComicQueueConfiguration: Parameters<typeof RmqModule.registerAsync>[0] = {
  connectionName: 'sync_comic_queue',
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Promise<IRmqOptions> | IRmqOptions => {
    return {
      queue: 'sync_comic_queue',
      urls: [{
        username: configService.get("RABBITMQ_USERNAME"),
        password: configService.get("RABBITMQ_PASSWORD"),
        hostname: configService.get("RABBITMQ_HOST"),
        port: +configService.get("RABBITMQ_PORT"),
      }],
      queueOptions: {
        durable: true,
      },
      extends: {
        exchanges: [
          {
            name: 'sync.comic',
            type: 'topic',
            options: {
              durable: true,
            },
          },
        ],
        bindings: [
          {
            exchange: 'sync.comic',
            routingKeys: ['comic.#'],
          },
        ],
      }
    };
  },
};
