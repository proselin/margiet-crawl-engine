import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { EnvKey } from '@/config/environment';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            host: configService.get(EnvKey.REDIS_HOST),
            port: +configService.get(EnvKey.REDIS_PORT),
            password: configService.get(EnvKey.REDIS_PASSWORD),
            username: configService.get(EnvKey.REDIS_USERNAME),
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class BullmqConnectModule {}
