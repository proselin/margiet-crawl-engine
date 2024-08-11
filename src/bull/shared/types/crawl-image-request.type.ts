import { ObjectId } from 'mongoose';

export interface CrawlChapterObject {
  chapterNumber: string;
  chapterId: string;
  chapterURL: string;
}