import { ChapterDocument } from '@/entities/chapter';
import { ImageDocument } from '@/entities/image';

export class CrawlChapterResultModel {
  chapter: ChapterDocument;
  images: ImageDocument[];
}
