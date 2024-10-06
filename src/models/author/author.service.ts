import { BaseCurdService } from '@/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Author } from '@/models/author/author.schema';

@Injectable()
export class AuthorService extends BaseCurdService<Author> {
  constructor(
    @InjectModel(Author.name) protected readonly model: Model<Author>,
  ) {
    super(new Logger(AuthorService.name), model);
  }
}
