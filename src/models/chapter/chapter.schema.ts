import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Image } from '@/models/image/image.schema';
import mongoose, { HydratedDocument } from 'mongoose';

// Chapter Schema
export type ChapterDocument = HydratedDocument<Chapter>;

@Schema({
  timestamps: true,
})
export class Chapter {
  @Prop({ type: String })
  dataId: string;

  @Prop({ type: String })
  chapterNumber: string;

  @Prop({ type: String })
  source_url: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: Image.name }] })
  images: Image[];

  @Prop({ type: String })
  name: string;

  @Prop({ type: Number, index: true })
  position: number;

  @Prop({ type: String})
  comicId: string;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
