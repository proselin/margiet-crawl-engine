import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Image } from '@crawl-engine/image/image.schema';
import mongoose, { HydratedDocument } from 'mongoose';

export type ChapterDocument = HydratedDocument<Chapter>;
@Schema({
  timestamps: true,
})
export class Chapter {
  @Prop()
  chapterId: String;

  @Prop()
  chapterNumber: String;

  @Prop()
  sourceUrl: String;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  })
  images: Image[];
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
