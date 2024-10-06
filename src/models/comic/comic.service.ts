import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Comic, ComicDocument } from '@/models/comic/comic.schema';

@Injectable()
export class ComicService extends BaseCurdService<ComicDocument> {
  constructor(
    @InjectModel(Comic.name) public readonly model: Model<ComicDocument>,
  ) {
    super(new Logger(ComicService.name), model);
  }
}
