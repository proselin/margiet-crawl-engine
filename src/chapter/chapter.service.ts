import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseCurdService } from '@crawl-engine/common';
import { Chapter } from '@crawl-engine/chapter/chapter.schema';

@Injectable()
export class ChapterService extends BaseCurdService<Chapter> {
  constructor(
    @InjectModel(Chapter.name) protected readonly model: Model<Chapter>,
  ) {
    super(new Logger(ChapterService.name), model);
  }

}
