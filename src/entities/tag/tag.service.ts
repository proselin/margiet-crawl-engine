import { Tag } from '@/entities/tag/tag.schema';
import { BaseCurdService } from '@/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityConfig } from '@/common/base/entity/entity-config';

@Injectable()
export class TagService extends BaseCurdService<Tag> {
  constructor(
    @InjectModel(EntityConfig.ModelName.Tag)
    protected readonly model: Model<Tag>,
  ) {
    super(new Logger(TagService.name), model);
  }
}
