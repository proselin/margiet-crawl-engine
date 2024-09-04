import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Comic } from '@/comic/comic.schema';

@Injectable()
export class ComicService extends BaseCurdService<Comic> {
  constructor(@InjectModel(Comic.name) public readonly model: Model<Comic>) {
    super(new Logger(ComicService.name), model);
  }
}
