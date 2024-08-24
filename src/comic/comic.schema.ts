import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Image } from '@crawl-engine/image/image.schema';

export const ShortData: Record<string, any> = {
  name: { type: String },
  id: { type: mongoose.Schema.Types.ObjectId },
};

export type ComicDocument = HydratedDocument<Comic>;

@Schema({
  timestamps: true,
  autoIndex: true,
})
export class Comic {
  @Prop(
    raw({
      name: String,
      id: String,
    }),
  )
  tags: {
    name: string;
    id: string;
  }[];

  @Prop()
  name: String;

  @Prop()
  chapterCount: Number;

  @Prop(
    raw({
      name: String,
      id: String,
    }),
  )
  author: {
    name: string;
    id: string;
  };

  @Prop(
    raw({
      name: String,
      id: String,
    }),
  )
  status: {
    name: string;
    id: string;
  };

  @Prop()
  description: String;

  @Prop(
    raw([
      {
        name: String,
        id: String,
        position: Number,
      },
    ]),
  )
  chapters: {
    name: string;
    id: string;
  }[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
  })
  thumbUrl: Image;
}

export const ComicSchema = SchemaFactory.createForClass(Comic);
