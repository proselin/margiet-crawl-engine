import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ImageDocument = HydratedDocument<Image>;
@Schema({
  timestamps: true,
  autoIndex: true,
})
export class Image {
  @Prop()
  url: String | null;

  @Prop()
  bucket: String;

  @Prop()
  position: Number;
}
export const ImageSchema = SchemaFactory.createForClass(Image);
