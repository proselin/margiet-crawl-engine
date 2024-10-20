import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ImageDocument } from '@/entities/image/image.schema';
import { ChapterDocument } from '@/entities/chapter/chapter.schema';
import { AuthorDocument } from '@/entities/author/author.schema';
import { BaseEntity } from '@/base/entity/base-entity';
import { TagDocument } from '@/entities/tag';
import { EntityConfig } from '@/base/entity/entity-config';

const { String, Number, ObjectId, Array, Boolean } = mongoose.Schema.Types;

export type ComicDocument = HydratedDocument<Comic>;

@Schema()
export class Comic extends BaseEntity {
  @Prop({
    type: [
      {
        type: ObjectId,
        ref: EntityConfig.ModelName.Tag,
      },
    ],
    default: [],
  })
  tags: TagDocument[];

  @Prop({
    type: String,
    index: true,
  })
  title: string;

  @Prop({
    type: Number,
  })
  chapter_count: number;

  @Prop({
    type: ObjectId,
    ref: EntityConfig.ModelName.Author,
  })
  author: AuthorDocument;

  @Prop({
    type: String,
  })
  status: string;

  @Prop({
    type: String,
  })
  description: string;

  @Prop({
    type: [
      {
        type: ObjectId,
        ref: EntityConfig.ModelName.Chapter,
      },
    ],
    default: [],
  })
  chapters: ChapterDocument[];

  @Prop({
    type: ObjectId,
    ref: EntityConfig.ModelName.Image,
  })
  thumb_image: ImageDocument;

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
