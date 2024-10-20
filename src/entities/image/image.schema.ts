import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseEntity } from '@/base/entity/base-entity';

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
    type: String,
  })
  chapterId: string;

  @Prop({
    type: String,
  })
  comicId: string;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
