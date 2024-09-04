import { Injectable, Logger } from '@nestjs/common';
import { BaseCurdService } from '@/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Status } from '@/status/status.schema';

@Injectable()
export class StatusService extends BaseCurdService<Status> {
  constructor(
    @InjectModel(Status.name) protected readonly model: Model<Status>,
  ) {
    super(new Logger(StatusService.name), model);
  }
}
