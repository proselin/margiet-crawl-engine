import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { exec } from 'node:child_process';

import { ComicEntity } from '../../../../entities/comic';
import { CrawlImageService } from './crawl-image.service';
import {
  CrawlChapterData,
  CrawlComicExecuteCurlResult$1,
  ExtractChapterInfoResult$1,
  ExtractChapterInfoResultItem$1,
} from '../../../../common';
import { ChapterEntity } from '../../../../entities/chapter';
import { ImageEntity } from '../../../../entities/image';
import { NettruyenHttpService } from './nettruyen-http.service';

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

  async crawlChapterInfo(job: Job<CrawlChapterData>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { domain, image } = await this.extractChapterInfo(job.data.url);

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
          image,
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
  ): Promise<ExtractChapterInfoResult$1> {
    const { data: body } = await this.netttruyenHttpService.get(url);
    const domain = new URL(url).origin;
    const imageRegex =
      /data-sv1=['"]([^'"]*)['"][^>]*data-sv2=['"]([^'"]*)['"]/g;
    const results: ExtractChapterInfoResult$1 = {
      image: [],
      domain: domain,
    };
    let dataUrls;
    let count = 0;
    while ((dataUrls = imageRegex.exec(body)) !== null) {
      results.image.push({
        imageUrls: [dataUrls[1] ?? '', dataUrls[2] ?? ''],
        position: count,
      } satisfies ExtractChapterInfoResultItem$1);
      count++;
    }
    return results;
  }
}
