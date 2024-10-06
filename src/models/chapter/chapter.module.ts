import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from '@/models/chapter/chapter.schema';
import { ChapterService } from '@/models/chapter/chapter.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Chapter.name , schema: ChapterSchema }],
      
    ),
  ],
  providers: [ChapterService],
  exports: [ChapterService],
})
export class ChapterModule {}
