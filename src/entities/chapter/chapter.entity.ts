import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

import { CommonEntity, CrawlingStatus } from "../../common";
import { ComicEntity } from "../comic";
import { ImageEntity } from "../image";

@Entity("chapter")
export class ChapterEntity extends CommonEntity {
  @Column({
    name: "chapter_num",
  })
  chapterNumber: string;

  @Column({
    name: "source_url",
    type: "varchar",
  })
  sourceUrl: string;

  @Column({ type: String })
  title: string;

  @Column({
    type: "int",
  })
  position: number;

  @Column({
    type: "enum",
    enum: CrawlingStatus,
    name: "crawling_status",
  })
  crawlStatus: CrawlingStatus;

  @ManyToOne(() => ComicEntity, comic => comic.chapters, {
    lazy: true,
  })
  comic: ComicEntity;

  @OneToMany(() => ImageEntity, image => image.chapter, {
    lazy: true,
  })
  images: ImageEntity[];
}
