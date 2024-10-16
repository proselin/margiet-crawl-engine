import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CrawlChapterData } from '@/jobs/bullmq/shared/types';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { Chapter } from '@/entities/chapter/chapter.schema';
import { ChapterService } from '@/entities/chapter/chapter.service';
import { CrawlImageService } from '@/jobs/bullmq/consumers/craw-consumer/services/crawl-image.service';
import { ImageDocument } from '@/entities/image';
import { ComicService } from '@/entities/comic';
import { CrawlChapterResultModel } from '@/models/jobs/consumer/crawl-chapter-result.model';

@Injectable()
export class CrawlChapterService {
  private readonly logger = new Logger(CrawlChapterService.name);

  constructor(
    private chapterService: ChapterService,
    @InjectBrowser() private readonly browser: Browser,
    private readonly crawlImageService: CrawlImageService,

    private readonly comicService: ComicService,
  ) {}

  async handleCrawlJob(job: Job<CrawlChapterData>) {
    const page = await this.browser.newPage();
    try {
      await this.preparePage(page, job.data.url);
      const imgServerUrls = await page.$$eval('.page-chapter img', (imgs) =>
        imgs.map((img) => {
          return [img.dataset.sv1, img.dataset.sv2];
        }),
      );

      const createdChapter = await this.chapterService.createOne(
        this.mapDataToChapterDTO(
          job.data.url,
          job.data.dataId,
          job.data.chapNumber,
          job.data.position,
        ),
      );

      const uploadedImage: ImageDocument[] =
        await this.crawlImageService.crawlAndUploadChapterImage(page, {
          chapterId: createdChapter.id,
          goto: job.data.url,
          images: imgServerUrls.map((imageUrls, index) => {
            return {
              imageUrls,
              position: index,
            };
          }),
        });

      await this.comicService.linkChapterToComic(
        job.data.comicId,
        createdChapter,
      );

      return {
        chapter: createdChapter,
        images: uploadedImage,
      } as CrawlChapterResultModel;
    } catch (e) {
      this.logger.error(`Crawl job ${job.token} Fail :=`);
      this.logger.error(e);
    } finally {
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

  private mapDataToChapterDTO(
    sourceUrl: string,
    dataId: string,
    chapNumber: string,
    position: number,
  ) {
    const dto = new Chapter();
    dto.dataId = dataId;
    dto.images = [];
    dto.chapterNumber = chapNumber;
    dto.position = position;
    dto.title = 'Chapter ' + chapNumber;
    dto.source_url = sourceUrl;
    return dto;
  }
}
