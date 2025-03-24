import { ComicEntity } from '@libs/database';

export class UpdateComicResultModel {
  comic: ComicEntity;
  updateChapters: any[];
}
