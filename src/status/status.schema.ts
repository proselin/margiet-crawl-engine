import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StatusDocument = HydratedDocument<Status>;
@Schema({
  timestamps: true,
  autoIndex: true,
})
export class Status {
  @Prop()
  name: string;
}
export const StatusSchema = SchemaFactory.createForClass(Status);
