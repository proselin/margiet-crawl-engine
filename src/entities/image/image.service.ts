import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Image } from '@/entities/image/image.schema';
import { EntityConfig } from '@/common/base/entity/entity-config';

@Injectable()
export class ImageService extends BaseCurdService<Image> {
  constructor(
    @InjectModel(EntityConfig.ModelName.Image)
    public readonly model: Model<Image>,
  ) {
    super(new Logger(ImageService.name), model);
  }
}
