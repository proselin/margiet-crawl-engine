import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TagSchema } from '@/tag/tag.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Tag', schema: TagSchema }])],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
