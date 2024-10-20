import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { BaseEntity } from '@/base/entity/base-entity';
import { EntityConfig } from '@/base/entity/entity-config';
import { ImageDocument } from '@/entities/image';

// Chapter Schema
export type ChapterDocument = HydratedDocument<Chapter>;

@Schema()
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
  images: ImageDocument[];

  @Prop({ type: String })
  title: string;

  @Prop({ type: Number, index: true })
  position: number;

  @Prop({ type: String })
  comicId: string;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
