import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Status, StatusSchema } from '@/models/status/status.schema';
import { StatusService } from '@/models/status/status.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Status.name, schema: StatusSchema }]),
  ],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
