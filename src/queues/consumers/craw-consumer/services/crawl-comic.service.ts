import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ComicEntity } from '../../../../entities/comic';
import { CrawlProducerService } from '../../../producers/crawl-producer';
import { CrawlImageService } from './crawl-image.service';
import {
  CrawlComicJobData,
  InfoExtractedResult$1,
  RawCrawledChapter,
  UpdateComicJobData,
} from '../../../../common';
import {
  CrawlComicResultModel,
  UpdateComicResultModel,
} from '../../../../models/jobs';
import { ImageEntity } from '../../../../entities/image';
import { NettruyenHttpService } from './nettruyen-http.service';
import { NettruyenExtractor } from '../extractor/nettruyen.extractor';

@Injectable()
export class CrawlComicService {
  private logger = new Logger(CrawlComicService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private readonly crawlProducerService: CrawlProducerService,
    private readonly crawlImageService: CrawlImageService,
    private readonly dataSource: DataSource,
    private readonly nettruyenHttpService: NettruyenHttpService,
    private readonly nettruyenExtractor: NettruyenExtractor,
  ) {}

  async crawlComicInfo(job: Job<CrawlComicJobData>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const crawledInformation = await this.extractInfo(job.data.href);
      await this.comicRepository.existsBy({originId: crawledInformation.comicId}).then(
        r => {
          if(r) throw new Error("comic is already exists");
        }
      )

      const comic: ComicEntity = new ComicEntity();
      comic.urlHistory = [job.data.href];
      comic.originUrl = job.data.href;
      await job.updateProgress(10);

      comic.originId = crawledInformation.comicId

      if (crawledInformation.title) {
        comic.title = crawledInformation.title;
      }

      comic.chapterCount = +crawledInformation.chapters.length;
      await job.updateProgress(15);

      if (crawledInformation.thumbUrl) {
        comic.thumbImage = Promise.resolve(
          this.updateThumbImageComic(comic, crawledInformation.thumbUrl, crawledInformation.domain),
        );
        await comic.thumbImage;
        await job.updateProgress(55);
      }

      this.logger.log('Process create new comic');
      await job.updateProgress(75);
      await queryRunner.manager.save(comic);
      await queryRunner.commitTransaction();

      return {
        chapters: crawledInformation.chapters ?? [],
        comic,
      } satisfies CrawlComicResultModel;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Crawl Comic failed >>');
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async extractInfo(url: string): Promise<InfoExtractedResult$1> {
    const response = await this.nettruyenHttpService.get(url);
    const body = response.data;
    return this.nettruyenExtractor.extract(body, url);
  }

  /**
   * @description Refresh or update existed comic-fe value
   * @param job queues from bullmq
   */
  public async updateComicCrawled(job: Job<UpdateComicJobData>) {
    this.logger.log(`[${this.updateComicCrawled.name}]::= Update comic`);
    const comic = await this.comicRepository.findOneByOrFail({
      id: job.data.comicId,
    });

    if (!comic) {
      throw new Error('Dont exist comicId: ' + job.data.comicId);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (job.data.newUrl) {
        comic.originUrl = job.data.newUrl;
      }

      const rawData = await this.extractInfo(job.data.newUrl);
      const lastedChapter = comic.chapterCount;
      let refresh: 1 | 0 = 0;

      if (rawData.title != comic.title) {
        comic.title = rawData.title;
        refresh = 1;
      }

      let updateChapters = [];
      if (rawData.chapters.length > lastedChapter) {
        updateChapters = rawData.chapters.filter((_, i) => i > lastedChapter);
      }
      comic.shouldRefresh = !!refresh;
      await queryRunner.manager.save(comic);
      await queryRunner.commitTransaction();
      return {
        comic: comic,
        updateChapters: updateChapters,
      } as UpdateComicResultModel;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`[${this.updateComicCrawled.name}]::= Fail`, e);
    } finally {
      await queryRunner.release();
    }
    await job.updateProgress(100);
  }

  createJobCrawlForChapter(chapters: RawCrawledChapter[], comicId: number) {
    return this.crawlProducerService.addCrawlChapterJobs(
      chapters.map((chapter, index) => {
        return {
          url: chapter.href,
          chapNumber: chapter.chapterNumber,
          comicId,
          position: index,
        };
      }),
    );
  }

  private async updateThumbImageComic(
    comic: ComicEntity,
    thumbUrl: string,
    domain: string,
  ): Promise<ImageEntity> {
    comic.thumbImage = null;
    this.logger.log('Process crawl image-fe thumb url');
    return this.crawlImageService.handleCrawlThumbUrl([thumbUrl], domain);
  }
}
