import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChapterSchema } from '@/entities/chapter/chapter.schema';
import { ChapterService } from '@/entities/chapter/chapter.service';
import { EntityConfig } from '@/common/base/entity/entity-config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntityConfig.ModelName.Chapter, schema: ChapterSchema },
    ]),
  ],
  providers: [ChapterService],
  exports: [ChapterService],
})
export class ChapterModule {}
