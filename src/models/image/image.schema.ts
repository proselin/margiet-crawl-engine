import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Image Schema
export type ImageDocument = HydratedDocument<Image>;

@Schema({
  timestamps: true,
  autoIndex: true,
})
export class Image {
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

  @Prop({ type: Number, index: true }) // Indexed position for sorting
  position: number;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
