import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Image } from '@/image/image.schema';
import mongoose, { HydratedDocument } from 'mongoose';

export type ChapterDocument = HydratedDocument<Chapter>;

@Schema({
  timestamps: true,
})
export class Chapter {
  @Prop()
  dataId: String;

  @Prop()
  chapterNumber: String;

  @Prop()
  sourceUrl: String;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  })
  images: Image[];

  @Prop()
  name: String;

  @Prop()
  position: Number;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
