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

  @Column({
    nullable: true,
  })
  status: string;

  @Column({
    nullable: true,
  })
  description: string;

  @Column({
    name: 'origin_url',
  })
  originUrl: string;

  @Column({
    type: 'simple-array',
    name: 'url_history',
    nullable: true,
  })
  urlHistory: string[];

  @Column({
    name: 'should_refresh',
    type: 'boolean',
    default: false,
  })
  shouldRefresh: boolean;

  @OneToMany(() => TagEntity, (tag) => tag.comic, {
    lazy: true,
  })
  tags: Promise<TagEntity[]>;

  @ManyToOne(() => AuthorEntity, (author) => author.comics, {
    lazy: true,
  })
  author: Promise<AuthorEntity>;

  @OneToMany(() => ChapterEntity, (chapter) => chapter.comic, {
    lazy: true,
  })
  chapters: Promise<ChapterEntity[]>;

  @OneToOne(() => ImageEntity, {
    lazy: true,
  })
  thumbImage: Promise<ImageEntity>;
}
