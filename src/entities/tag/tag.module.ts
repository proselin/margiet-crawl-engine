import { Module } from '@nestjs/common';
import { TagEntity } from '@/entities/tag/tag.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity])],
  exports: [TypeOrmModule],
})
export class TagModule {}
