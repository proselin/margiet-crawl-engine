import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { ComicEntity } from "../../../entities/comic";
import { CrawlProducerService } from "../../../producers/crawl-producer";
import {
  CrawlChapterData,
  CrawlComicJobData,
  CrawlingStatus,
  InfoExtractedResult$1,
  RawCrawledChapter,
  UpdateComicJobData,
} from "../../../common";
import { UpdateComicResultModel } from "../../../models/jobs";
import { NettruyenHttpService } from "./nettruyen-http.service";
import { NettruyenExtractor } from "../extractor/nettruyen.extractor";
import { ImageType } from "../../../common/constant/image";

@Injectable()
export class CrawlComicService {
  private logger = new Logger(CrawlComicService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private readonly producer: CrawlProducerService,
    private readonly dataSource: DataSource,
    private readonly nettruyenHttpService: NettruyenHttpService,
    private readonly nettruyenExtractor: NettruyenExtractor,
  ) {}

  async handleCrawlComic(job: Job<CrawlComicJobData>) {
    try {
      const crawledInformation = await this.extractInfo(job.data.href);
      await this.comicRepository.existsBy({ originId: crawledInformation.comicId }).then(r => {
        if (r) throw new Error("comic is already exists");
      });

      const comic: ComicEntity = new ComicEntity();
      comic.urlHistory = [job.data.href];
      comic.originUrl = job.data.href;

      comic.originId = crawledInformation.comicId;

      if (crawledInformation.title) {
        comic.title = crawledInformation.title;
      }

      comic.chapterCount = +crawledInformation.chapters.length;
      comic.crawlStatus = CrawlingStatus.ON_CRAWL;

      this.logger.log("Process create new comic");
      await comic.save();

      await this.addJobsCrawlThumb(crawledInformation.domain, crawledInformation.thumbUrl, comic.id);
      await this.addJobCrawlChapterFlow(crawledInformation.chapters, comic.id);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async extractInfo(url: string): Promise<InfoExtractedResult$1> {
    const response = await this.nettruyenHttpService.get(url);
    const body = response.data;
    return this.nettruyenExtractor.extract(body, url);
  }

  private async addJobCrawlChapterFlow(chapters: RawCrawledChapter[], comicId: number) {
    const length = chapters.length;
    const dataCrawlingChapters = chapters.map((chapter, index) => {
      return {
        url: chapter.href,
        chapNumber: chapter.chapterNumber,
        comicId: comicId,
        position: length - index,
      } satisfies CrawlChapterData;
    });
    await this.producer.addFlowCrawlChapterByComic(dataCrawlingChapters, comicId);
  }

  /**
   * @description Refresh or update existed comic-fe value
   * @param job queues from bullmq
   */
  public async handleUpdateComic(job: Job<UpdateComicJobData>) {
    this.logger.log(`[${this.handleUpdateComic.name}]::= Update comic`);
    const comic = await this.comicRepository.findOneByOrFail({
      id: job.data.comicId,
    });

    if (!comic) {
      throw new Error("Dont exist comicId: " + job.data.comicId);
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
      this.logger.error(`[${this.handleUpdateComic.name}]::= Fail`, e);
    } finally {
      await queryRunner.release();
    }
    await job.updateProgress(100);
  }

  public async handleUpdateStatusComicToDone(job: Job<{ comicId: number }>) {
    this.logger.log(`Start handleUpdateStatusComicToDone comicId=${job.data.comicId}`);
    await job.updateProgress(0);
    const comic = await this.comicRepository.findOneByOrFail({ id: job.data.comicId });
    comic.crawlStatus = CrawlingStatus.DONE;
    await job.updateProgress(100);
    await comic.save();
  }

  private async addJobsCrawlThumb(domain: string, thumbUrl: string, comicId: number) {
    await this.producer.addFlowCrawlThumbByComic(
      {
        type: ImageType.THUMB,
        domain: domain,
        dataUrls: [thumbUrl],
        position: 0,
        comicId: comicId,
      },
      comicId,
    );
  }

  public async handleUpdateThumbImageToComic(job: Job<{ comicId: number }>) {
    this.logger.log(
      `[${this.handleUpdateThumbImageToComic.name}]::= Start put thumb image to comicId: ${job.data.comicId}`,
    );
    await this.comicRepository.update(
      {
        id: job.data.comicId,
      },
      {
        thumbImage: {
          id: Object.values(await job.getChildrenValues())[0],
        },
      },
    );
    this.logger.log(
      `[${this.handleUpdateThumbImageToComic.name}]::= Done put thumb image to comicId: ${job.data.comicId}`,
    );
  }
}
