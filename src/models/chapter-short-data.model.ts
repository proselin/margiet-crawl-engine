import { ObjectId } from 'mongoose';

export class ChapterShortDataModel {
  name: string;
  id: ObjectId;
  position: number;
}