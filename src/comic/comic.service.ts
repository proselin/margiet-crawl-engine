import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@crawl-engine/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Comic } from '@crawl-engine/comic/comic.schema';

@Injectable()
export class ComicService extends BaseCurdService<Comic> {
  constructor(@InjectModel(Comic.name) protected readonly model: Model<Comic>) {
    super(new Logger(ComicService.name), model);
  }
}
