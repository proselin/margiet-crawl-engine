import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { ChapterEntity } from '@/entities/chapter/chapter.entity';
import { CrawlImageService } from '@/queues/consumers/craw-consumer/services/crawl-image.service';
import { CrawlChapterResultModel } from '@/models/jobs/consumer/crawl-chapter-result.model';
import { CrawlChapterData } from '@/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ImageEntity } from '@/entities/image';
import { ComicEntity } from '@/entities/comic';

@Injectable()
export class CrawlChapterService {
  private readonly logger = new Logger(CrawlChapterService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private comicRepository: Repository<ComicEntity>,
    @InjectBrowser() private readonly browser: Browser,
    private readonly crawlImageService: CrawlImageService,
    private dataSource: DataSource,
  ) {}

  async crawlChapterInfo(job: Job<CrawlChapterData>) {
    const page = await this.browser.newPage();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.preparePage(page, job.data.url);
      const imgServerUrls = await page.$$eval('.page-chapter img', (imgs) =>
        imgs.map((img) => {
          return [img.dataset.sv1, img.dataset.sv2];
        }),
      );

      const comic = await this.comicRepository.findOneByOrFail({
        id: job.data.comicId,
      });

      const chapter = new ChapterEntity();

      chapter.chapterNumber = job.data.chapNumber;
      chapter.position = job.data.position;
      chapter.title = 'Chapter ' + job.data.chapNumber;
      chapter.dataId = job.data.dataId;
      chapter.sourceUrl = job.data.url;

      chapter.comic = Promise.resolve(comic);

      await queryRunner.manager.save(chapter)

      const images = imgServerUrls.map((imageUrls, index) => ({
        imageUrls,
        position: index,
      }));

      const imageEntities: ImageEntity[] =
        await this.crawlImageService.crawlAndUploadChapterImage(
          chapter,
          images,
          queryRunner
        );

      await queryRunner.manager.save(chapter)
      await queryRunner.commitTransaction();

      const result : CrawlChapterResultModel =   {
        chapter,
        images: imageEntities,
      }
      return result;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Crawl job ${job.token} Fail :=`, e)
    } finally {
      await queryRunner.release();
      await page.close();
    }
  }

  async preparePage(page: Page, url: string) {
    await page.setJavaScriptEnabled(false);
    await page.setCacheEnabled(false);
    await page.setRequestInterception(true);
    await this.abortRequest(page, [url]);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 0,
    });

    page.off('request');
    await page.setRequestInterception(false);
    return page;
  }

  private async abortRequest(page: Page, ignoreUrls: string[]) {
    page.on('request', (request) => {
      const url = request.url();
      if (ignoreUrls.includes(url)) {
        request.continue();
        return;
      }
      request.abort('blockedbyclient');
    });
  }
}
