import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseEntity } from '@/common/base/entity/base-entity';

export type TagDocument = HydratedDocument<Tag>;

@Schema()
export class Tag extends BaseEntity {
  @Prop({
    type: String,
  })
  title: string;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
