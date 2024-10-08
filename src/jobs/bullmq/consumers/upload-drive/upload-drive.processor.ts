import { Constant } from '@/utils/constant';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { UploadDriveService } from './upload-drive.service';
import { JobConstant } from '@/jobs/bullmq/shared';

@Injectable()
@Processor(Constant.QUEUE_UPLOAD_NAME)
export class UploadDriveProcessor extends WorkerHost {
  constructor(private readonly uploadService: UploadDriveService) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case JobConstant.UPLOAD_JOB_NAME: {
        return this.uploadService.handleUploadImage(job);
      }
      default:
        throw new Error(`Invalid name: ${job.name} to process`);
    }
  }
}
