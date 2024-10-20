import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseCurdService } from '@/base';
import { Chapter } from '@/entities/chapter/chapter.schema';
import { Image } from '@/entities/image';
import { EntityConfig } from '@/base/entity/entity-config';

@Injectable()
export class ChapterService extends BaseCurdService<Chapter> {
  constructor(
    @InjectModel(EntityConfig.ModelName.Chapter)
    protected readonly _model: Model<Chapter>,
  ) {
    super(new Logger(ChapterService.name), _model);
  }

  updateChapterImages(images: Image[], chapterId: string) {
    return this.findByIdAndUpdate({ _id: chapterId }, { $push: { images } });
  }
}
