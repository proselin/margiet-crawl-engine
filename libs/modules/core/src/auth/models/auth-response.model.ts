import { Field, ObjectType } from '@nestjs/graphql';
import { UserResponseModel } from './user-response.model';

@ObjectType()
export class SessionType {
  @Field()
  access_token: string;

  @Field()
  refresh_token: string;

  @Field()
  expires_at: number;
}

@ObjectType()
export class AuthResponseModel {
  @Field(() => UserResponseModel)
  user: UserResponseModel;

  @Field(() => SessionType)
  session: SessionType;
}
