import { ShortData } from '@/models/rmq/short-data.model';

export class SyncComicMessageData {
  comic_id: string;
  tags: ShortData[];
  author: ShortData;
  status: string;
  name: string;
  description: string;
  chapter_count: number;
}
