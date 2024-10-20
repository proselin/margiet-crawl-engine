import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { BaseEntity } from '@/base/entity/base-entity';
import { Chapter } from '@/entities/chapter';
import { EntityConfig } from '@/base/entity/entity-config';

export type ImageDocument = HydratedDocument<Image>;

@Schema()
export class Image extends BaseEntity {
  @Prop({ type: String, default: null, index: true }) // Indexed URL for search
  url: string | null;

  @Prop({ type: [String], default: [], index: true })
  originUrls: string[];

  @Prop({
    type: {
      driverId: String,
      fileName: String,
      parentFolderId: String,
      url: String,
    },
  })
  driverInfo: {
    driverId: string;
    fileName: string;
    parentFolderId: string;
    url: string;
  };

  @Prop({
    type: {
      bucketName: String,
      fileName: String,
      url: String,
    },
  })
  minioInfo: { bucketName: string; fileName: string; url: string };

  @Prop({ type: Number, index: true })
  position: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: EntityConfig.ModelName.Chapter,
  })
  chapter: Chapter;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
