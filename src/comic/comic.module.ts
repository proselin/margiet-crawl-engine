import { Module } from '@nestjs/common';
import { ComicService } from './comic.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ComicSchema } from '@crawl-engine/comic/comic.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Comic', schema: ComicSchema }]),
  ],
  providers: [ComicService],
  exports: [ComicService],
})
export class ComicModule {}
