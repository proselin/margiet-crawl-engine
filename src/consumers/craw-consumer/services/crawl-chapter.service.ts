import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { ComicEntity } from "../../../entities/comic";
import {
  CrawlChapterData,
  CrawlImageJobData,
  CrawlingStatus,
  ExtractChapterInfoResult$1,
  ExtractChapterInfoResultItem$1,
} from "../../../common";
import { ChapterEntity } from "../../../entities/chapter";
import { NettruyenHttpService } from "./nettruyen-http.service";
import { CrawlProducerService } from "../../../producers/crawl-producer";
import { ImageType } from "../../../common/constant/image";

@Injectable()
export class CrawlChapterService {
  private readonly logger = new Logger(CrawlChapterService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private comicRepository: Repository<ComicEntity>,
    @InjectRepository(ChapterEntity)
    private chapterRepository: Repository<ChapterEntity>,
    private dataSource: DataSource,
    private readonly producer: CrawlProducerService,
    private readonly http: NettruyenHttpService,
  ) {}

  async handleCrawlChapter(job: Job<CrawlChapterData>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    this.logger.log(`Start handleCrawlChapter with params ${JSON.stringify(job.data)}`);

    try {
      const { domain, image } = await this.extractChapterInfo(job.data.url);

      const comic = await this.comicRepository.findOneByOrFail({
        id: job.data.comicId,
      });
      const chapter = new ChapterEntity();

      chapter.chapterNumber = job.data.chapNumber;
      chapter.position = job.data.position;
      chapter.title = "Chapter " + job.data.chapNumber;
      chapter.sourceUrl = job.data.url;
      chapter.comic = comic;
      chapter.crawlStatus = CrawlingStatus.ON_CRAWL;

      await chapter.save();
      this.logger.log(`Save new chapter id=${chapter.id} with job data`);

      const requestImages = image.map(item => {
        return {
          domain,
          type: ImageType.CHAPTER_IMAGE,
          position: item.position,
          dataUrls: item.imageUrls,
          chapterId: chapter.id,
        } satisfies CrawlImageJobData;
      });

      await this.producer.addFlowCrawlImagesByChapter(requestImages, chapter.id);

      await queryRunner.commitTransaction();
      this.logger.log(`Complete handleCrawlChapter with chapterId=${chapter.id}`);
      return chapter;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error handleCrawlChapter`);
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async handleUpdateStatusChapterToDone(job: Job<{ chapterId: number }>) {
    await job.updateProgress(0);
    this.logger.log(`Start handleUpdateStatusChapterToDone with params=${JSON.stringify(job.data)}`);
    await this.chapterRepository.update(
      { id: job.data.chapterId },
      {
        crawlStatus: CrawlingStatus.DONE,
      },
    );
    await job.updateProgress(100);
    this.logger.log(`DONE handleUpdateStatusChapterToDone with params=${JSON.stringify(job.data)}`);
  }

  private async extractChapterInfo(url: string): Promise<ExtractChapterInfoResult$1> {
    const { data: body } = await this.http.get(url);
    const domain = new URL(url).origin;
    const imageRegex = /data-sv1=['"]([^'"]*)['"][^>]*data-sv2=['"]([^'"]*)['"]/g;
    const results: ExtractChapterInfoResult$1 = {
      image: [],
      domain: domain,
    };
    let dataUrls;
    let count = 0;
    while ((dataUrls = imageRegex.exec(body)) !== null) {
      results.image.push({
        imageUrls: [dataUrls[1] ?? "", dataUrls[2] ?? ""],
        position: count,
      } satisfies ExtractChapterInfoResultItem$1);
      count++;
    }
    return results;
  }
}
