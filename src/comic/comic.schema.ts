import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Image } from '@/image/image.schema';
import { Chapter } from '@/chapter/chapter.schema';
import { Tag } from '@/tag/tag.schema';
import { Author } from '@/author/author.schema';
import { Status } from '@/status/status.schema';

const { String, Number, ObjectId, Array, Boolean } = mongoose.Schema.Types;

export type ComicDocument = HydratedDocument<Comic>;

@Schema({
  timestamps: true,
})
export class Comic {
  @Prop(
    raw({
      name: String,
      id: {
        type: ObjectId,
        required: true,
        ref: Tag.name,
      },
    }),
  )
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
        required: true,
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
        required: true,
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
