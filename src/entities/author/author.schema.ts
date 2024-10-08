import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseEntity } from '@/common/base/entity/base-entity';

export type AuthorDocument = HydratedDocument<Author>;

@Schema({
  timestamps: true,
  autoIndex: true,
})
export class Author extends BaseEntity {
  @Prop({
    type: String,
  })
  title: string;
}
export const AuthorSchema = SchemaFactory.createForClass(Author);
