import { ComicEntity } from '@shared/database';

export class UpdateComicResultModel {
  comic: ComicEntity;
  updateChapters: any[];
}
