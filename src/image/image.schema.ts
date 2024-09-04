import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ImageDocument = HydratedDocument<Image>;
@Schema({
  timestamps: true,
  autoIndex: true,
})
export class Image {
  @Prop()
  url: String | null;

  @Prop({
    type: raw({
      driverId: String,
      fileName: String,
      parentFolderId: String,
      url: String,
    }),
  })
  driverInfo: {
    driverId: string;
    fileName: string;
    parentFolderId: string;
    url: string;
  };

  @Prop({
    type: raw({
      bucketName: String,
      fileName: String,
      url: String,
    }),
  })
  minioInfo: {
    bucketName: string;
    fileName: string;
    url: string;
  };

  @Prop()
  position: Number;
}
export const ImageSchema = SchemaFactory.createForClass(Image);
