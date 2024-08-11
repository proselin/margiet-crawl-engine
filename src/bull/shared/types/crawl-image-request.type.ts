import { ObjectId } from 'mongoose';

export interface CrawlChapterObject {
  docId: string
  chapterNumber: string;
  chapterId: string;
  chapterURL: string;
}