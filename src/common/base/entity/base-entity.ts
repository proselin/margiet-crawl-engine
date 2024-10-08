import { Prop } from '@nestjs/mongoose';

export abstract class BaseEntity {
  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}
