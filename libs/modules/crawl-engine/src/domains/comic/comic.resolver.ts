import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ComicResolverService } from './services/comic-resolver.service';
import { ComicPageableResponse } from './responses';
import { ComicPageableInput } from './dtos/comic-pageable.input';
import { ComicDetailsResponse } from './responses/comic-details.response';
import { ComicModel } from '@shared/graphql';
import { StatusOnlyMutationResponseModel } from '@modules/crawl-engine/common/types/status-only-mutation-response.model';

@Resolver(() => ComicModel)
export class ComicResolver {
  constructor(private comicService: ComicResolverService) {}

  @Query(() => ComicPageableResponse, {
    name: 'pageableComics',
  })
  comics(
    @Args({
      name: 'pageable',
      type: () => ComicPageableInput,
      nullable: false,
    })
    pageable: ComicPageableInput,
  ): Promise<ComicPageableResponse> {
    return this.comicService.getComics(pageable);
  }

  @Query(() => ComicDetailsResponse, {
    name: 'comicDetails',
  })
  comic(
    @Args({ type: () => Number, nullable: false, name: 'comicId' })
    comicId: number,
  ): Promise<ComicDetailsResponse> {
    return this.comicService.getComic(comicId);
  }

  @Mutation(() => StatusOnlyMutationResponseModel)
  public async pullComic(
    @Args({
      type: () => String,
      name: 'href',
    })
    href: string,
  ) {
    try {
      new URL(href) // Validate URL
      await this.comicService.pullComic(href);
      return {
        code: 'CE-OK',
        message: 'Success',
        success: true,
      } satisfies StatusOnlyMutationResponseModel;
    } catch (error) {
      throw error
    }
  }
}
