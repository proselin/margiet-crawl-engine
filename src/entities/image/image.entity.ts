import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";

import { CommonEntity } from "../../common";
import { DriverUploadHistory } from "../driver-upload-history";
import { MinioUploadHistory } from "../minio-upload-history";
import { ChapterEntity } from "../chapter";
import { ComicEntity } from "../comic";
import { ImageType } from "../../common/constant/image";

@Entity("image")
export class ImageEntity extends CommonEntity {
  @Column({
    type: "varchar",
    length: 1000,
  })
  url: string;

  @Column({
    type: "integer",
  })
  position: number;

  @Column({
    type: "enum",
    enum: ImageType,
    default: ImageType.CHAPTER_IMAGE,
  })
  type: ImageType;

  @Column({ type: "simple-array", name: "origin_urls" })
  originUrls: string[];

  @OneToOne(() => DriverUploadHistory, {
    lazy: true,
  })
  @JoinColumn()
  driverUploadHistory: DriverUploadHistory;

  @OneToOne(() => MinioUploadHistory, {
    lazy: true,
  })
  @JoinColumn()
  minioUploadHistory: MinioUploadHistory;

  @ManyToOne(() => ChapterEntity, chapter => chapter.images)
  chapter: ChapterEntity | Partial<ChapterEntity>;

  @OneToOne(() => ComicEntity)
  comic: ComicEntity | Partial<ComicEntity>;
}
