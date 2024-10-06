import { Injectable } from '@nestjs/common';
import { InjectRmq, RmqService } from '@libs/rabbitmq';

@Injectable()
export class SyncComicRmqProducer {
  constructor(
    @InjectRmq('sync_comic_queue') private readonly rmqService: RmqService,
  ) { }

  get syncComicQueue(): RmqService {
    return this.rmqService
  }

  syncComicCreated(createdInfo) {
    return this.syncComicQueue.emitToQueue('sync.comic.created', createdInfo);
  }

  syncComicUpdate(updateInfo) {
    return this.syncComicQueue.emitToQueue('sync.comic.updated', updateInfo);
  }

  syncChapterCreate(chapterInfo) {
    return this.syncComicQueue.emitToQueue('sync.chapter.created', chapterInfo);
  }



  syncImage(imageInfo) {
    return this.syncComicQueue.emitToQueue('sync.image', imageInfo);
  }
}