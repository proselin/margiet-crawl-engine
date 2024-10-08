import { CrawlProducerModule } from '@/jobs/bullmq/producers/crawl-producer';
import { ComicModule } from '@/entities/comic/comic.module';
import { Module } from '@nestjs/common';
import { RefreshComicService } from './refresh-comic.service';

@Module({
  imports: [CrawlProducerModule, ComicModule],
  providers: [RefreshComicService],
  exports: [RefreshComicService],
})
export class RefreshComicModule {}
