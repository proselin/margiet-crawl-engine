import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { CommonEntity } from './common.entity';
import { ImageType } from '@libs/common/constant/image';
import { DriverUploadHistory } from './drive-upload-history.entity';
import { MinioUploadHistory } from './minio-upload-history.entity';
import { ChapterEntity } from './chapter.entity';
import { ComicEntity } from './comic.entity';

@Entity('image')
export class ImageEntity extends CommonEntity {
  @Column({
    type: 'varchar',
    length: 1000,
  })
  url: string;

  @Column({
    type: 'integer',
  })
  position: number;

  @Column({
    type: 'enum',
    enum:ImageType,
    default: ImageType.CHAPTER_IMAGE
  })
  type: ImageType;

  @Column({ type: 'simple-array', name: 'origin_urls' })
  originUrls: string[];

  @OneToOne(() => DriverUploadHistory, {
    lazy: true,
  })
  @JoinColumn()
  driverUploadHistory: Promise<DriverUploadHistory>;

  @OneToOne(() => MinioUploadHistory, {
    lazy: true,
  })
  @JoinColumn()
  minioUploadHistory: Promise<MinioUploadHistory>;

  @ManyToOne(() => ChapterEntity, (chapter) => chapter.images)
  chapter: ChapterEntity;

  @OneToOne(() => ComicEntity)
  comic: ComicEntity;
}
