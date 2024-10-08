import { ChapterModule } from '@/entities/chapter';
import { ConstantBase } from '@/common/utils/constant.base';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { UploadDriveProcessor } from './upload-drive.processor';
import { UploadDriveService } from './upload-drive.service';
import { ImageModule } from '@/entities/image';
import { RmqProducerModule } from '@/jobs/rabbitmq/producer/rmq-producer.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ConstantBase.QUEUE_UPLOAD_NAME,
      defaultJobOptions: {
        delay: 500,
        backoff: 3,
      },
    }),
    RmqProducerModule,
    ImageModule,
    ChapterModule,
  ],
  providers: [UploadDriveProcessor, UploadDriveService],
})
export class UploadDriveModule {}
