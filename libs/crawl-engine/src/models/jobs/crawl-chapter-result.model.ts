import { ChapterEntity, ImageEntity } from '@libs/database';

export class CrawlChapterResultModel {
  chapter: ChapterEntity;
  images: ImageEntity[];
}
