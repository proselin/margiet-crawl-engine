import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntityGqlModel } from '@shared/graphql/common';

@ObjectType({
  description: 'User Model',
})
export class UserModel extends BaseEntityGqlModel {
  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  displayName: string;

  @Field(() => String, { nullable: true })
  avatarUrl: string;

  @Field(() => String)
  supabaseId: string;

  @Field(() => String, { nullable: true })
  role: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Date, { nullable: true })
  lastLogin: Date;
}
