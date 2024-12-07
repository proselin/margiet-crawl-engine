import { ComicEntity } from '@/entities/comic';
import { InfoExtractedResult$1 } from '@/common';

export class CrawlComicResultModel {
  comic: ComicEntity;
  chapters: InfoExtractedResult$1['chapters'];
}
