import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseEntity } from '@/base/entity/base-entity';

export type AuthorDocument = HydratedDocument<Author>;

@Schema()
export class Author extends BaseEntity {
  @Prop({
    type: String,
  })
  title: string;
}
export const AuthorSchema = SchemaFactory.createForClass(Author);
