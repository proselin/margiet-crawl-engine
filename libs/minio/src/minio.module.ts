import { Module } from '@nestjs/common';
import { NestMinioModule } from '@margiet-libs/minio';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestMinioModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          endPoint: configService.get('minio.endpoint'),
          useSSL: !!configService.get('minio.ssl'),
          port: +configService.get('minio.port'),
          accessKey: configService.get('minio.access-key', null),
          secretKey: configService.get('minio.secret-key', null),
        };
      },
    }),
  ],
})
export class MinioModule {}
