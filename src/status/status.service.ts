import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@crawl-engine/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Status } from '@crawl-engine/status/status.schema';

@Injectable()
export class StatusService extends BaseCurdService<Status> {
  constructor(
    @InjectModel(Status.name) protected readonly model: Model<Status>,
  ) {
    super(new Logger(StatusService.name), model);
  }

}
