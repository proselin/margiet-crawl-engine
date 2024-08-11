import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Author } from './author.schema';
import { ClientSession, Model } from 'mongoose';
import { BaseCurdService } from '@crawl-engine/common';

@Injectable()
export class AuthorService extends BaseCurdService<Author> {
  constructor(
    @InjectModel(Author.name) protected readonly model: Model<Author>,
  ) {
    super(new Logger(AuthorService.name), model);
  }
}
