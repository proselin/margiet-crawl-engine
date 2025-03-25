import { ChapterEntity, ImageEntity } from '@shared/database';

export class CrawlChapterResultModel {
  chapter: ChapterEntity;
  images: ImageEntity[];
}
