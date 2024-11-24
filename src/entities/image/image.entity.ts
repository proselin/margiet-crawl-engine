import { CommonEntity } from '@/common/entity/common.entity';
import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';
import { DriverUploadHistory } from '@/entities/driver-upload-history';
import { MinioUploadHistory } from '@/entities/minio-upload-history/minio-upload-history.entity';
import { ChapterEntity } from '@/entities/chapter';
import { ComicEntity } from '@/entities/comic';

@Entity('image')
export class ImageEntity extends CommonEntity {
  @Column({
    type: 'varchar',
    length: 1000,
    default: null,
  })
  url: string;

  @Column({
    type: 'integer',
  })
  position: number;

  @Column({ type: 'json', name: 'origin_urls' })
  originUrls: string[];

  @OneToOne(() => DriverUploadHistory, {
    eager: true,
  })
  driverUploadHistory: DriverUploadHistory;

  @OneToOne(() => MinioUploadHistory, {
    eager: true,
  })
  minioUploadHistory: MinioUploadHistory;

  @ManyToOne(() => ChapterEntity, (chapter) => chapter.images)
  chapter: ChapterEntity;

  @OneToOne(() => ComicEntity)
  comic: ComicEntity;
}
