import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@/base';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Image } from '@/entities/image/image.schema';
import { EntityConfig } from '@/base/entity/entity-config';

@Injectable()
export class ImageService extends BaseCurdService<Image> {
  constructor(
    @InjectModel(EntityConfig.ModelName.Image)
    protected readonly _model: Model<Image>,
  ) {
    super(new Logger(ImageService.name), _model);
  }

  findOneImageIdUploaded(imageId: string) {
    return this._model
      .findOne({
        _id: {
          $match: imageId,
        },
        driverInfo: {
          $exists: true,
        },
      })
      .exec();
  }

  async setComicIdByImageId(imageId: string, comicId: string) {
    const image = await this._model.findById(imageId).exec();
    if (!image) {
      throw new Error('Image not found !!');
    }
    image.comicId = comicId;
    await image.save();
    return image;
  }
}
