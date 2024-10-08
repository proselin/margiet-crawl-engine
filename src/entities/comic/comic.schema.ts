import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Image } from '@/entities/image/image.schema';
import { Chapter } from '@/entities/chapter/chapter.schema';
import { Author } from '@/entities/author/author.schema';
import { BaseEntity } from '@/common/base/entity/base-entity';
import { Tag } from '@/entities/tag';
import { EntityConfig } from '@/common/base/entity/entity-config';

const { String, Number, ObjectId, Array, Boolean } = mongoose.Schema.Types;

export type ComicDocument = HydratedDocument<Comic>;

@Schema({
  timestamps: true,
  autoIndex: true,
})
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
  tags: Tag[];

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
  author: Author;

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
  chapters: Chapter[];

  @Prop({
    type: ObjectId,
    ref: EntityConfig.ModelName.Image,
  })
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
