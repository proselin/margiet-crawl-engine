import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StatusOnlyMutationResponseModel {
  @Field({ defaultValue: false })
  success: boolean;

  @Field({ defaultValue: "500"})
  code: string;

  @Field({ defaultValue: "Unknown Error" })
  message: string;

  constructor(success: boolean, code: string, message: string) {
    this.success = success;
    this.code = code;
    this.message = message;
  }
}