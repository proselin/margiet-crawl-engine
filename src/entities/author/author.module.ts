import { Module } from '@nestjs/common';
import { AuthorEntity } from '@/entities/author/author.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AuthorEntity])],
  exports: [TypeOrmModule],
})
export class AuthorModule {}
