import { ObjectId } from 'mongoose';
import { IsString } from 'class-validator';

export class CrawlChapterJobDataDto {
  @IsString()
  chapterId: ObjectId | string;
  @IsString()
  chapterNumber: string;
  @IsString()
  chapterURL: string;
}
