import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserResponseModel {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field()
  provider: string;
}
