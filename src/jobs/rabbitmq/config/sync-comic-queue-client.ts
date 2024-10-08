import { ConfigService } from '@nestjs/config';
import { RmqConfig } from '@/jobs/rabbitmq/config/rmq.config';
import { IRmqOptions, RmqModule } from '@margiet-libs/rmq';

export const syncComicQueueConfiguration: Parameters<
  typeof RmqModule.registerAsync
>[0] = {
  connectionName: 'sync_comic_queue',
  inject: [ConfigService],
  useFactory: (
    configService: ConfigService,
  ): Promise<IRmqOptions> | IRmqOptions => {
    return {
      queue: RmqConfig.SyncQueue.queueName,
      urls: [
        {
          username: configService.get('RABBITMQ_USERNAME'),
          password: configService.get('RABBITMQ_PASSWORD'),
          hostname: configService.get('RABBITMQ_HOST'),
          port: +configService.get('RABBITMQ_PORT'),
        },
      ],
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
      },
    };
  },
};
