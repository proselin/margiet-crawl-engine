import { Module } from '@nestjs/common';
import { RefreshComicService } from './refresh-comic.service';
import { CrawlProducerModule } from '../../queues/producers/crawl-producer';
import { ComicEntity } from '@libs/database';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [CrawlProducerModule, TypeOrmModule.forFeature([ComicEntity])],
  providers: [RefreshComicService],
  exports: [RefreshComicService],
})
export class RefreshComicModule {}
