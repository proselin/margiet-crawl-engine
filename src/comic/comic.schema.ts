import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, ObjectId } from 'mongoose';

export const ShortData: Record<string, any> = {
  name: { type: String },
  id: { type: mongoose.Schema.Types.ObjectId },
};

export type ShortData = {
  name: string;
  id: string | ObjectId;
};

export type ComicDocument = HydratedDocument<Comic>;

@Schema({
  timestamps: true,
  autoIndex: true,
})
export class Comic {
  @Prop(raw(ShortData))
  tags: ShortData[];

  @Prop()
  name: string;

  @Prop()
  chapterCount: Number;

  @Prop(raw(ShortData))
  author: ShortData;

  @Prop(raw(ShortData))
  status: ShortData;

  @Prop()
  description: String;

  @Prop(raw([ShortData]))
  chapters: ShortData[];
}

export const ComicSchema = SchemaFactory.createForClass(Comic);
