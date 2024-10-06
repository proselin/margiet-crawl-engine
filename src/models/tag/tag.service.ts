import { Tag } from '@/models/tag/tag.schema';
import { BaseCurdService } from '@/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TagService extends BaseCurdService<Tag> {
  constructor(@InjectModel(Tag.name) protected readonly model: Model<Tag>) {
    super(new Logger(TagService.name), model);
  }
}
