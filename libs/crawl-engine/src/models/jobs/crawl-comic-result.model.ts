import { ComicEntity } from '@libs/database';
import { IInfoExtractedComicPageResult$1 } from './info-extracted-comic-result.model';

export class CrawlComicResultModel {
  comic: ComicEntity;
  chapters: IInfoExtractedComicPageResult$1['chapters'];
}
