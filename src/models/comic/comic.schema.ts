import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Image } from '@/models/image/image.schema';
import { Chapter } from '@/models/chapter/chapter.schema';
import { Author } from '@/models/author/author.schema';
import { Status } from '@/models/status/status.schema';

const { String, Number, ObjectId, Array, Boolean } = mongoose.Schema.Types;

export type ComicDocument = HydratedDocument<Comic>;

@Schema({
  timestamps: true,
})
export class Comic {
  @Prop({
    type: [
      {
        id: {
          type: ObjectId,
          ref: 'tag',
        },
        name: {
          type: String,
          require: true,
        },
      },
    ],
    default: [],
  })
  tags: {
    name: string;
    id: string;
  }[];

  @Prop({
    type: String,
    index: true,
  })
  name: string;

  @Prop({
    type: Number,
  })
  chapter_count: number;

  @Prop(
    raw({
      name: String,
      id: {
        type: ObjectId,
        ref: Author.name,
      },
    }),
  )
  author: {
    name: string;
    id: string;
  };

  @Prop(
    raw({
      name: String,
      id: {
        type: ObjectId,
        ref: Status.name,
      },
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

  @Prop({
    raw: [
      {
        name: String,
        id: {
          type: ObjectId,
          ref: Chapter.name,
        },
        position: Number,
      },
    ],
    default: [],
  })
  chapters: {
    name: string;
    id: string;
    position: number;
  }[];

  @Prop(
    raw({
      url: String,
      id: {
        type: ObjectId,
        index: true,
        ref: Image.name,
      },
    }),
  )
  thumb_image: Image;

  @Prop({
    type: String,
  })
  origin_url: string;

  @Prop({
    type: Array,
    default: [],
  })
  url_history: string[];

  @Prop({
    type: Boolean,
    default: false,
  })
  is_current_url_is_notfound: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  should_refresh: boolean;
}

export const ComicSchema = SchemaFactory.createForClass(Comic);
