import { Module } from '@nestjs/common';
import { CrawlController } from './crawl.controller';
import { CrawlService } from './crawl.service';
import { ChapterModule } from '@crawl-engine/chapter/chapter.module';
import { AuthorModule } from '@crawl-engine/author/author.module';
import { ComicModule } from '@crawl-engine/comic/comic.module';
import { StatusModule } from '@crawl-engine/status/status.module';
import { TagModule } from '@crawl-engine/tag/tag.module';
import { ImageModule } from '@crawl-engine/image/image.module';
import { CrawlProducerModule } from '@crawl-engine/bull/producers/crawl-producer';

@Module({
  imports: [
    ChapterModule,
    AuthorModule,
    ComicModule,
    StatusModule,
    TagModule,
    ImageModule,
    CrawlProducerModule
  ],
  controllers: [CrawlController],
  providers: [CrawlService],
  exports: [CrawlService],
})
export class CrawlModule {}
