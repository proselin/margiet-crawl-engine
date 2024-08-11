import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Injectable()
@Processor('CrawlJob')
export class CrawlJobProcessor extends WorkerHost {
  private logger = new Logger(CrawlJobProcessor.name);

  process(job: Job, token?: string): Promise<any> {
    this.logger.log(JSON.stringify(job));
    this.logger.log(JSON.stringify(token));
    return Promise.resolve('');
  }
}
