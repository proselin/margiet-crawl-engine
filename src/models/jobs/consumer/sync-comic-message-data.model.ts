import { ShortData } from '@/models/jobs/consumer/short-data.model';

export class SyncComicMessageData {
  comic_id: string;
  tags: ShortData[];
  author: ShortData;
  status: string;
  title: string;
  description: string;
  chapter_count: number;
}
