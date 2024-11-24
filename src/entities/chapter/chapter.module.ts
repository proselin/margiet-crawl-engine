import { Module } from '@nestjs/common';
import { ChapterEntity } from '@/entities/chapter/chapter.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ChapterEntity])],
  exports: [TypeOrmModule],
})
export class ChapterModule {}
