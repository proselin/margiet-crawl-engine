import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Image } from '@/image/image.schema';

const { String, Number, ObjectId, Date, Array, Boolean } = mongoose.Schema.Types;

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
    type: String,
  })
  name: string;

  @Prop({
    type: Number,
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
    type: String,
  })
  description: string;

  @Prop(
    {
    raw: ([
      {
        name: String,
        id: String,
        position: Number,
      },
    ]),
    default: []
    }
  )
  chapters: {
    name: string;
    id: string;
    position: number;
  }[];

  @Prop({
    type: ObjectId,
    ref: 'Image',
  })
  thumbUrl: Image;

  @Prop({
    type: String,
  })
  originUrl: string;

  @Prop({
    type: Date
  })
  updatedAt: Date;

  @Prop({
    type: Array,
    default: []
  })
  url_history: string[]

  @Prop({
    type: Boolean,
    default: false
  })
  is_current_url_is_notfound: boolean
}

export const ComicSchema = SchemaFactory.createForClass(Comic);
