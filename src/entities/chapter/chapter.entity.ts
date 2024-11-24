import { ImageEntity } from '@/entities/image';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { ComicEntity } from '@/entities/comic';
import { CommonEntity } from '@/common/entity/common.entity';

@Entity('chapter')
export class ChapterEntity extends CommonEntity {
  @Column()
  dataId: string;

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
  comic: ComicEntity;

  @OneToMany(() => ImageEntity, (image) => image.chapter)
  images: ImageEntity[];
}
