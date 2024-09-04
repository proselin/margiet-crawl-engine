import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from '@/chapter/chapter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chapter.name, schema: ChapterSchema }]),
  ],
  providers: [ChapterService],
  exports: [ChapterService],
})
export class ChapterModule {}
