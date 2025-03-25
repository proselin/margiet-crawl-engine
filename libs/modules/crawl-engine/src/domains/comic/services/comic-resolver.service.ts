import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ComicPageableInput } from '../dtos/comic-pageable.input';
import { ComicPageableResponse } from '../responses';
import { InjectRepository } from '@nestjs/typeorm';
import { ComicEntity } from '@shared/database';
import { ComicModel } from '@shared/graphql';
import { CrawlProducerService } from '@modules/crawl-engine/queues';

interface IComicService {
  getComics(pageable: ComicPageableInput): Promise<ComicPageableResponse>;
}

@Injectable()
export class ComicResolverService implements IComicService {
  private logger: Logger = new Logger(ComicResolverService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private comicRepository: Repository<ComicEntity>,
    private producerService: CrawlProducerService
  ) {}

  async getComics(
    pageable: ComicPageableInput,
  ): Promise<ComicPageableResponse> {
    const { page, limit, sortBy, sortOrder } = pageable;
    const queryBuilder = this.comicRepository.createQueryBuilder('comic');

    // Apply sorting if `sortBy` and `sortOrder` are provided
    if (sortBy && sortOrder) {
      queryBuilder.orderBy(`comic.${sortBy}`, sortOrder);
    }

    // Apply pagination (skip = (page - 1) * limit)
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Get the total count of users
    const [items, totalCount] = await queryBuilder.getManyAndCount();

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    return {
      items: items as unknown as ComicModel[],
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    } satisfies ComicPageableResponse;
  }

  async getComic(comicId: number): Promise<ComicModel> {
    if (!isFinite(comicId)) {
      throw new BadRequestException(`ComicId is not number`);
    }
    const comic = await this.comicRepository
      .createQueryBuilder('comic')
      .leftJoinAndSelect('comic.chapters', 'chapter')
      .where('comic.id= :comicId', { comicId })
      .orderBy('chapter.position', 'DESC')
      .getOne();

    if (!comic)
      throw new NotFoundException(`Comic with id ${comicId} not found`);
    return comic as unknown as ComicModel;
  }

  /**
   * @param href
   * @description Add a queues crawl comic to queue
   * @returns {Promise<void>}
   */
  async pullComic(href: string): Promise<any> {
    return this.producerService.addCrawlComicJob(href);
  }
}
