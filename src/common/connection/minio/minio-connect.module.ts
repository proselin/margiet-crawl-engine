import { Module } from '@nestjs/common';
import { NestMinioModule } from 'nestjs-minio';
import { ConfigService } from '@nestjs/config';
import { EnvKey } from '@crawl-engine/environment';

@Module({
  imports: [
    NestMinioModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          endPoint: configService.get(EnvKey.MINIO_ENDPOINT, 'localhost'),
          port: +configService.get(EnvKey.MINIO_PORT, 9000),
          accessKey: configService.get(EnvKey.MINIO_ACCESS_KEY, null),
          secretKey: configService.get(EnvKey.MINIO_SECRET_KEY, null),
        };
      },
    }),
  ],
})
export class MinioConnectModule {}
