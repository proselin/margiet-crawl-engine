import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChapterEntity } from '@shared/database';
import { ChapterResolverService } from './services';
import { ChapterResolver } from './chapter.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ChapterEntity])],
  providers: [ChapterResolverService, ChapterResolver],
})
export class ChapterDomainModule {}
