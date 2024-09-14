import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RedisOptions } from 'bullmq';

export class RedisConfig {
  static config(env: Record<string, string>): RedisOptions {
    return {
      host: env.REDIS_HOST,
      port: +env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      username: env.REDIS_USERNAME,
    };
  }

  static connectRedisMicroservice(
    env: Record<string, any>,
  ): MicroserviceOptions {
    return {
      transport: Transport.REDIS,
      options: {
        ...RedisConfig.config(env),
      },
    };
  }
}
