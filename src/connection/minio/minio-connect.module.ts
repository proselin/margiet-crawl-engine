import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKey } from '@/config/environment';
import { NestMinioModule } from '@margiet-libs/minio';

@Module({
  imports: [
    NestMinioModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          endPoint: configService.get(EnvKey.MINIO_ENDPOINT, 'localhost'),
          useSSL: false,
          port: +configService.get(EnvKey.MINIO_PORT, 9000),
          accessKey: configService.get(EnvKey.MINIO_ACCESS_KEY, null),
          secretKey: configService.get(EnvKey.MINIO_SECRET_KEY, null),
        };
      },
    }),
  ],
})
export class MinioConnectModule {}
