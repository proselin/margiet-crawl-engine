import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { CommonEntity } from './common.entity';
import { ComicEntity } from './comic.entity';
import { ImageEntity } from './image.entity';

@Entity('chapter')
export class ChapterEntity extends CommonEntity {
  @Column({
    name: 'chapter_num',
  })
  chapterNumber: string;

  @Column({
    name: 'source_url',
    type: 'varchar',
  })
  sourceUrl: string;

  @Column({ type: String })
  title: string;

  @Column({
    type: 'int',
  })
  position: number;

  @ManyToOne(() => ComicEntity, (comic) => comic.chapters, {
    lazy: true,
  })
  comic: Promise<ComicEntity>;

  @OneToMany(() => ImageEntity, (image) => image.chapter, {
    lazy: true,
  })
  images: Promise<ImageEntity[]>;
}
