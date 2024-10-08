import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImageSchema } from '@/entities/image/image.schema';
import { ImageService } from '@/entities/image/image.service';
import { EntityConfig } from '@/common/base/entity/entity-config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntityConfig.ModelName.Image, schema: ImageSchema },
    ]),
  ],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
