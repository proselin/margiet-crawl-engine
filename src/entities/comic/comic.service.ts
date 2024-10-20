import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@/base';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ComicDocument } from '@/entities/comic/comic.schema';
import { Chapter } from '@/entities/chapter';
import { EntityConfig } from '@/base/entity/entity-config';

@Injectable()
export class ComicService extends BaseCurdService<ComicDocument> {
  constructor(
    @InjectModel(EntityConfig.ModelName.Comic)
    protected readonly _model: Model<ComicDocument>,
  ) {
    super(new Logger(ComicService.name), _model);
  }

  async linkChapterToComic(comicId: string, chapter: Chapter) {
    const existedComic = await this._model.exists({ _id: comicId }).exec();
    if (!existedComic) {
      throw new Error('Comic not found');
    }
    return this._model
      .updateOne({ _id: comicId }, { $push: { chapters: chapter } })
      .exec();
  }
}
