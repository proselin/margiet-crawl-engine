import { Module } from '@nestjs/common';
import { CacheModule, CacheOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import KeyvRedis, { Keyv, RedisClientOptions } from '@keyv/redis';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig: RedisClientOptions = {
          url: `redis://${configService.getOrThrow('redis.host')}:${configService.getOrThrow('redis.port')}`,
          password: configService.get('redis.password'),
          username: configService.get('redis.username'),
        };

        const keyv = new Keyv({
          store: new KeyvRedis(redisConfig),
          ttl: configService.getOrThrow('cache.ttl'),
        });

        return {
          store: keyv.store,
          ttl: configService.getOrThrow('cache.ttl'),
          max: configService.getOrThrow('cache.max'),
          refreshThreshold: configService.getOrThrow('cache.refresh-threshold'),
        } satisfies CacheOptions;
      },
    }),
  ],
})
export class CacheConfigModule {}
