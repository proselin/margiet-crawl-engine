import { Column, Entity, ManyToOne } from 'typeorm';
import { CommonEntity } from '@/common/entity/common.entity';
import { ComicEntity } from '@/entities/comic';

@Entity('tag')
export class TagEntity extends CommonEntity {
  @Column()
  title: string;

  @ManyToOne(() => ComicEntity, (comic) => comic.tags, {
    eager: false,
    lazy: true,
  })
  comic: ComicEntity;
}
