import { Column, Entity, OneToOne } from 'typeorm';
import { ImageEntity } from '@/entities/image';
import { CommonEntity } from '@/common';

@Entity('minio-upload-history')
export class MinioUploadHistory extends CommonEntity {
  @Column({
    nullable: true,
  })
  bucketName: string;

  @Column({
    nullable: true,
  })
  fileName: string;

  @Column({
    nullable: true,
  })
  url: string;

  @OneToOne(() => ImageEntity, (img) => img.minioUploadHistory, {
    lazy: true,
  })
  image: Promise<ImageEntity>;
}
