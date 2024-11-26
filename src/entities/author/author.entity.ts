import { Column, Entity, OneToMany } from 'typeorm';
import { CommonEntity } from '@/common/entity/common.entity';
import { ComicEntity } from '@/entities/comic';

@Entity('author')
export class AuthorEntity extends CommonEntity {
  @Column({
    type: 'varchar',
    length: 1000,
  })
  title: string;

  @OneToMany(() => ComicEntity, (comic) => comic.author, {
    lazy: true,
  })
  comics: Promise<ComicEntity[]>;
}
