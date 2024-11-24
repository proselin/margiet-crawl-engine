import { TagEntity } from '@/entities/tag';
import { CommonEntity } from '@/common/entity/common.entity';
import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { AuthorEntity } from '@/entities/author';
import { ChapterEntity } from '@/entities/chapter';
import { ImageEntity } from '@/entities/image';

@Entity('comic')
export class ComicEntity extends CommonEntity {
  @Column()
  title: string;

  @Column({
    name: 'chapter_count',
    type: 'integer',
  })
  chapterCount: number;

  @Column()
  status: string;

  @Column()
  description: string;

  @Column({
    name: 'origin_url',
  })
  originUrl: string;

  @Column({
    type: 'json',
    name: 'url_history',
  })
  urlHistory: string[];

  @Column({
    name: 'should_refresh',
    type: 'boolean',
    default: false,
  })
  shouldRefresh: boolean;

  @OneToMany(() => TagEntity, (tag) => tag.comic)
  tags: TagEntity[];

  @ManyToOne(() => AuthorEntity, (author) => author.comics)
  author: AuthorEntity;

  @OneToMany(() => ChapterEntity, (chapter) => chapter.comic)
  chapters: ChapterEntity[];

  @OneToOne(() => ImageEntity)
  thumbImage: ImageEntity;
}
