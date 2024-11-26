import { ShortData } from '@/models/jobs/consumer/short-data.model';

export class SyncComicMessageData {
  comicId: number;
  tags: ShortData[];
  author: ShortData;
  status: string;
  title: string;
  description: string;
  chapter_count: number;
}
