import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagSchema } from '@/entities/tag/tag.schema';
import { TagService } from '@/entities/tag/tag.service';
import { EntityConfig } from '@/base/entity/entity-config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntityConfig.ModelName.Tag, schema: TagSchema },
    ]),
  ],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
