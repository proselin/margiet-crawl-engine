import { Module } from "@nestjs/common";
import { CrawlProducerService } from "./crawl-producer.service";
import { BullModule } from "@nestjs/bullmq";

import { FlowName, QueueName } from "../../common";

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.QUEUE_CRAWL,
    }),
    BullModule.registerFlowProducer({
      name: FlowName.CRAWL_COMIC,
    }),
  ],
  providers: [CrawlProducerService],
  exports: [CrawlProducerService],
})
export class CrawlProducerModule {}
