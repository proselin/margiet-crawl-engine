import { Injectable } from '@nestjs/common';
import { SyncComicMessageData } from '@/models/rmq/producer/sync-comic-message-data.model';
import { SyncChapterMessageData } from '@/models/rmq/producer/sync-chapter-message-data.model';
import { ComicDocument } from '@/entities/comic';
import { ChapterDocument } from '@/entities/chapter';
import { RmqService } from '@margiet-libs/rmq/dist/services/rmq.service';
import { InjectRmq } from '@margiet-libs/rmq';
import { RmqConfig } from '@/jobs/rabbitmq/config/rmq.config';

@Injectable()
export class SyncComicRmqProducer {
  constructor(
    @InjectRmq(RmqConfig.SyncQueue.queueName)
    private readonly rmqService: RmqService,
  ) {}

  pushMessageSyncComic(comic: ComicDocument) {
    const syncComicMessageData = new SyncComicMessageData();
    syncComicMessageData.comic_id = comic.id;
    syncComicMessageData.author = {
      name: comic.author?.title,
      id: comic.author?.id,
    };
    syncComicMessageData.tags = comic.tags.map((tag) => {
      return {
        name: tag?.title,
        id: tag?.id,
      };
    });
    syncComicMessageData.status = comic.status;
    syncComicMessageData.name = comic.title;
    syncComicMessageData.description = comic.description;
    syncComicMessageData.chapter_count = comic.chapter_count;
    return this.rmqService.emitToQueue('sync.comic', syncComicMessageData);
  }

  pushMessageSyncChapter(chapter: ChapterDocument) {
    const syncChapterMessageData: SyncChapterMessageData =
      new SyncChapterMessageData();
    syncChapterMessageData.chapter_id = chapter.id;
    syncChapterMessageData.comic_id = chapter.comicId;
    syncChapterMessageData.name = chapter.title;
    syncChapterMessageData.position = chapter.position;
    return this.rmqService.emitToQueue('sync.chapter', syncChapterMessageData);
  }
}
