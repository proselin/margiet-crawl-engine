import { Module } from '@nestjs/common';
import { ComicEntity } from '@/entities/comic/comic.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ComicEntity])],
  exports: [TypeOrmModule],
})
export class ComicModule {}
