import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuthorDocument = HydratedDocument<Author>;

@Schema({
  timestamps: true,
})
export class Author {
  @Prop({
    type: String,
    required: true,
  })
  name: String;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
