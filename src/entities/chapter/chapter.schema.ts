import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Image } from '@/entities/image/image.schema';
import mongoose, { HydratedDocument } from 'mongoose';
import { BaseEntity } from '@/common/base/entity/base-entity';
import { EntityConfig } from '@/common/base/entity/entity-config';

// Chapter Schema
export type ChapterDocument = HydratedDocument<Chapter>;

@Schema({
  timestamps: true,
  autoIndex: true,
})
export class Chapter extends BaseEntity {
  @Prop({ type: String })
  dataId: string;

  @Prop({ type: String })
  chapterNumber: string;

  @Prop({ type: String })
  source_url: string;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: EntityConfig.ModelName.Image,
      },
    ],
  })
  images: Image[];

  @Prop({ type: String })
  title: string;

  @Prop({ type: Number, index: true })
  position: number;

  @Prop({ type: String })
  comicId: string;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
