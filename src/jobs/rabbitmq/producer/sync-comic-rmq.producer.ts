import { Injectable } from '@nestjs/common';
import { SyncComicMessageData } from '@/models/rmq/producer/sync-comic-message-data.model';
import { SyncChapterMessageData } from '@/models/rmq/producer/sync-chapter-message-data.model';
import { SyncImageMessageData } from '@/models/rmq/producer/sync-image-message-data.model';
import { ComicDocument } from '@/entities/comic';
import { ImageDocument } from '@/entities/image';
import { ChapterDocument } from '@/entities/chapter';
import { InjectRmq } from '@margiet-libs/rmq';
import { RmqService } from '@margiet-libs/rmq/dist/services/rmq.service';

@Injectable()
export class SyncComicRmqProducer {
  constructor(
    @InjectRmq('sync_comic_queue') private readonly rmqService: RmqService,
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
    const messageData: SyncChapterMessageData = new SyncChapterMessageData();
    messageData.chapter_id = chapter.id;
    messageData.comic_id = chapter.comicId;
    messageData.name = chapter.title;
    messageData.position = chapter.position;
    return this.rmqService.emitToQueue('sync.chapter', messageData);
  }

  pushMessageSyncImage(imageInfo: ImageDocument, chapterId: string) {
    const syncImageMessageData = new SyncImageMessageData();
    syncImageMessageData.url = imageInfo.url;
    syncImageMessageData.id = imageInfo.id;
    syncImageMessageData.chapter_id = chapterId;
    syncImageMessageData.position = imageInfo.position;
    return this.rmqService.emitToQueue('sync.image', imageInfo);
  }
}
