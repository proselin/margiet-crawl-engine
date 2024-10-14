import { ComicDocument } from '@/entities/comic';

export class UpdateComicResultModel {
  comic: ComicDocument;
  updateChapters: any[];
}
