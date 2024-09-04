import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Image } from '@/image/image.schema';

@Injectable()
export class ImageService extends BaseCurdService<Image> {
  constructor(@InjectModel(Image.name) public readonly model: Model<Image>) {
    super(new Logger(ImageService.name), model);
  }
}
