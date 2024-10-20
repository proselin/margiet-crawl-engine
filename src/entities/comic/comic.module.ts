import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComicSchema } from '@/entities/comic/comic.schema';
import { ComicService } from '@/entities/comic/comic.service';
import { EntityConfig } from '@/base/entity/entity-config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntityConfig.ModelName.Comic, schema: ComicSchema },
    ]),
  ],
  providers: [ComicService],
  exports: [ComicService],
})
export class ComicModule {}
