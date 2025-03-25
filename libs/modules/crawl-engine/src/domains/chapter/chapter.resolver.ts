import { Args, Query, Resolver } from '@nestjs/graphql';
import { ChapterResolverService } from './services/chapter-resolver.service';
import { ChapterModel } from '@shared/graphql';

@Resolver()
export class ChapterResolver {
  constructor(private chapterService: ChapterResolverService) {}

  @Query(() => [ChapterModel], { name: 'chaptersByComicId' })
  chapters(@Args('comicId') comicId: number) {
    return this.chapterService.getChaptersByComicId(comicId);
  }

  @Query(() => ChapterModel, { name: 'chapterById' })
  chapter(@Args('chapterId') chapterId: number) {
    return this.chapterService.getChapterById(chapterId);
  }
}
