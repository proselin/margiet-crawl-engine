import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TagDocument = HydratedDocument<Tag>;

@Schema({
  timestamps: true,
  autoIndex: true,
})
export class Tag {
  @Prop({
    type: String,
  })
  name: string;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
