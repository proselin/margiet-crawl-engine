import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@crawl-engine/common';
import { ClientSession, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Tag } from '@crawl-engine/tag/tag.schema';

@Injectable()
export class TagService extends BaseCurdService<Tag> {
  constructor(@InjectModel(Tag.name) protected readonly model: Model<Tag>) {
    super(new Logger(TagService.name), model);
  }

}
