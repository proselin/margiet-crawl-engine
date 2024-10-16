import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ComicDocument } from '@/entities/comic/comic.schema';
import { Chapter } from '@/entities/chapter';
import { EntityConfig } from '@/common/base/entity/entity-config';

@Injectable()
export class ComicService extends BaseCurdService<ComicDocument> {
  constructor(
    @InjectModel(EntityConfig.ModelName.Comic)
    public readonly model: Model<ComicDocument>,
  ) {
    super(new Logger(ComicService.name), model);
  }

  addChapterById(id: string, chapter: Chapter) {
    return this.findAndUpdate({ _id: id }, { $push: { chapters: chapter } });
  }

  async linkChapterToComic(comicId: string, chapter: Chapter) {
    const existedComic = await this.model.exists({ _id: comicId }).exec();
    if (!existedComic) {
      throw new Error('Comic not found');
    }
    return this.model
      .updateOne({ _id: comicId }, { $push: { chapters: chapter } })
      .exec();
  }
}
