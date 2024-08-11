import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@crawl-engine/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Image } from '@crawl-engine/image/image.schema';

@Injectable()
export class ImageService extends BaseCurdService<Image> {
  constructor(@InjectModel(Image.name) protected readonly model: Model<Image>) {
    super(new Logger(ImageService.name), model);
  }
}
