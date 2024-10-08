import * as mongoose from 'mongoose';
import { Prop } from '@nestjs/mongoose';

export abstract class BaseEntity {
  @Prop({ type: String })
  id: string;

  @Prop({ type: mongoose.Types.ObjectId })
  _id: mongoose.Types.ObjectId;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ type: Number })
  __v: number;
}
