import { Module } from '@nestjs/common';
import { ComicResolver } from './comic.resolver';
import { ComicResolverService } from './services';
import { CrawlProducerModule } from '../../queues';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChapterEntity, ComicEntity } from '@shared/database';

@Module({
  imports: [CrawlProducerModule, TypeOrmModule.forFeature([ComicEntity, ChapterEntity])],
  providers: [ComicResolver, ComicResolverService],
})
export class ComicDomainModule {}
