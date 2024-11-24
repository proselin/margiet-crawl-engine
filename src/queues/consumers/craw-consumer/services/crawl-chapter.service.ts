import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectBrowser } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { ChapterEntity } from '@/entities/chapter/chapter.entity';
import { CrawlImageService } from '@/queues/consumers/craw-consumer/services/crawl-image.service';
import { CrawlChapterResultModel } from '@/models/jobs/consumer/crawl-chapter-result.model';
import { CrawlChapterData } from '@/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

      const chapter = new ChapterEntity();

      chapter.chapterNumber = job.data.chapNumber;
      chapter.position = job.data.position;
      chapter.title = 'Chapter ' + job.data.chapNumber;
      chapter.dataId = job.data.dataId;
      chapter.sourceUrl = job.data.url;

      chapter.comic = await this.comicRepository.findOne({
        where: {
          id: job.data.comicId,
        },
      });
      await chapter.save();

      const uploadedImage: ImageEntity[] =
        await this.crawlImageService.crawlAndUploadChapterImage(page, {
          chapterId: chapter.id,
          goto: job.data.url,
          images: imgServerUrls.map((imageUrls, index) => {
            return {
              imageUrls,
              position: index,
            };
          }),
        });

      return {
        chapter,
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
}
