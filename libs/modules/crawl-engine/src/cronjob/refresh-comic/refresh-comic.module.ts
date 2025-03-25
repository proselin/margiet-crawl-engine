import { Module } from '@nestjs/common';
import { RefreshComicService } from './refresh-comic.service';
import { CrawlProducerModule } from '../../queues/producers';
import { ComicEntity } from '@shared/database';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [CrawlProducerModule, TypeOrmModule.forFeature([ComicEntity])],
  providers: [RefreshComicService],
  exports: [RefreshComicService],
})
export class RefreshComicModule {}
