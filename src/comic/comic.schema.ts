import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Image } from '@crawl-engine/image/image.schema';

const {String, Number, ObjectId} =  mongoose.Schema.Types

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

  @Prop({
      type: String
    })
  name: string;

  @Prop({
    type: Number
  })
  chapterCount: number;

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

  @Prop({
    type: String
  })
  description: string;

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
    position: number,
  }[];

  @Prop({
    type: ObjectId,
    ref: 'Image',
  })
  thumbUrl: Image;

  @Prop({
    type: String,
  })
  originUrl: string
}

export const ComicSchema = SchemaFactory.createForClass(Comic);
