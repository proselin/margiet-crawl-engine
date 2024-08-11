import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { MongooseModule } from '@nestjs/mongoose';
import { StatusSchema } from '@crawl-engine/status/status.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Status', schema: StatusSchema }]),
  ],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
