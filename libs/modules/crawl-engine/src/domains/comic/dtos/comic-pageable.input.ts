import { InputType } from '@nestjs/graphql';
import { PageableInput } from '@shared/graphql';

@InputType()
export class ComicPageableInput extends PageableInput {}
