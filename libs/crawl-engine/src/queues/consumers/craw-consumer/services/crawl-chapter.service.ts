import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CrawlImageService } from './crawl-image.service';
import { NettruyenHttpService } from './nettruyen-http.service';
import { ChapterEntity, ComicEntity, ImageEntity } from '@libs/database';
import {
  ICrawlChapterData,
  IExtractChapterInfoResult$1,
} from '../../../../models';

@Injectable()
export class CrawlChapterService {
  private readonly logger = new Logger(CrawlChapterService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private comicRepository: Repository<ComicEntity>,
    private readonly crawlImageService: CrawlImageService,
    private dataSource: DataSource,
    private netttruyenHttpService: NettruyenHttpService,
  ) {}

  async crawlChapterInfo(job: Job<ICrawlChapterData>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { domain, images } = await this.extractChapterInfo(job.data.url);

      const comic = await this.comicRepository.findOneByOrFail({
        id: job.data.comicId,
      });
      this.logger.log(`Found comic ${comic.id} !!!`);
      const chapter = new ChapterEntity();

      chapter.chapterNumber = job.data.chapNumber;
      chapter.position = job.data.position;
      chapter.title = 'Chapter ' + job.data.chapNumber;
      chapter.sourceUrl = job.data.url;

      chapter.comic = Promise.resolve(comic);

      await queryRunner.manager.save(chapter);
      this.logger.log(`Save new chapter with job data`);

      const imageEntities: ImageEntity[] =
        await this.crawlImageService.crawlAndUploadChapterImage(
          chapter,
          images,
          domain,
        );

      await queryRunner.manager.save(chapter);
      await queryRunner.commitTransaction();

      return {
        chapter,
        images: imageEntities,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Crawl job ${job.token} Fail :=`, e);
    } finally {
      await queryRunner.release();
    }
  }

  private async extractChapterInfo(
    url: string,
  ): Promise<IExtractChapterInfoResult$1> {
    const { data: body } = await this.netttruyenHttpService.get(url);
    const domain = new URL(url).origin;
    const imageRegex =
      /data-sv1=['"]([^'"]*)['"][^>]*data-sv2=['"]([^'"]*)['"]/g;
    const results: IExtractChapterInfoResult$1 = {
      images: [],
      domain: domain,
    };
    let imageUrls: string[];
    let count = 0;
    while ((imageUrls = imageRegex.exec(body)) !== null) {
      imageUrls = ((imageUrls as Array<string>) ?? []).slice(0, 1);
      results.images.push({
        imageUrls,
        position: count,
      } satisfies IExtractChapterInfoResult$1['images'][number]);
      count++;
    }
    return results;
  }
}
