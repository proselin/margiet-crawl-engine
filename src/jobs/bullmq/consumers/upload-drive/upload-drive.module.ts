import { ChapterModule } from '@/entities/chapter';
import { Constant } from '@/utils/constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { UploadDriveProcessor } from './upload-drive.processor';
import { UploadDriveService } from './upload-drive.service';
import { ImageModule } from '@/entities/image';

@Module({
  imports: [
    BullModule.registerQueue({
      name: Constant.QUEUE_UPLOAD_NAME,
      defaultJobOptions: {
        delay: 500,
        backoff: 3,
      },
    }),
    // RmqProducerModule,
    ImageModule,
    ChapterModule,
  ],
  providers: [UploadDriveProcessor, UploadDriveService],
})
export class UploadDriveModule {}
