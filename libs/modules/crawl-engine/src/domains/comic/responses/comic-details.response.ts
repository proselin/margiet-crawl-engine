import { ObjectType } from '@nestjs/graphql';
import { ComicModel } from '@shared/graphql';

@ObjectType()
export class ComicDetailsResponse extends ComicModel {}
