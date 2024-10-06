import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagSchema } from '@/models/tag/tag.schema';
import { TagService } from '@/models/tag/tag.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Tag', schema: TagSchema }])],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
