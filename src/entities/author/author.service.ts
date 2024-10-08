import { BaseCurdService } from '@/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Author } from '@/entities/author/author.schema';
import { EntityConfig } from '@/common/base/entity/entity-config';

@Injectable()
export class AuthorService extends BaseCurdService<Author> {
  constructor(
    @InjectModel(EntityConfig.ModelName.Author)
    protected readonly model: Model<Author>,
  ) {
    super(new Logger(AuthorService.name), model);
  }
}
