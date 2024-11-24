import { Module } from '@nestjs/common';
import { ImageEntity } from '@/entities/image/image.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinioUploadHistory } from '@/entities/minio-upload-history/minio-upload-history.entity';
import {
  DriverUploadHistory,
  DriverUploadHistoryModule,
} from '@/entities/driver-upload-history';
import { MinioUploadHistoryModule } from '@/entities/minio-upload-history';

@Module({
  imports: [
    DriverUploadHistoryModule,
    MinioUploadHistoryModule,
    TypeOrmModule.forFeature([
      ImageEntity,
      MinioUploadHistory,
      DriverUploadHistory,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class ImageModule {}
