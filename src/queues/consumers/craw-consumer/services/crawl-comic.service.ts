import { CrawlProducerService } from '@/queues/producers/crawl-producer';
import { ComicEntity } from '@/entities/comic/comic.entity';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CrawlImageService } from '@/queues/consumers/craw-consumer/services/crawl-image.service';
import { CrawlComicResultModel } from '@/models/jobs/consumer/crawl-comic-result.model';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CrawlComicExecuteCurlResult$1,
  CrawlComicJobData,
  InfoExtractedResult$1,
  RawCrawledChapter,
  UpdateComicJobData,
} from '@/common';
import { ImageEntity } from '@/entities/image';
import { UpdateComicResultModel } from '@/models/jobs/consumer/update-comic-result.model';
import { exec } from 'node:child_process';
import { LinkCrawlModel } from '@/models/jobs/consumer/link-crawl.model';

@Injectable()
export class CrawlComicService {
  private logger = new Logger(CrawlComicService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private readonly crawlProducerService: CrawlProducerService,
    private crawlImageService: CrawlImageService,
    private dataSource: DataSource,
  ) {}

  async crawlComicInfo(job: Job<CrawlComicJobData>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const crawledInformation = await this.extractInfo(job.data.href);

      const comic: ComicEntity = new ComicEntity();
      comic.urlHistory = [job.data.href];
      comic.originUrl = job.data.href;

      await job.updateProgress(10);
      if (crawledInformation.title) {
        comic.title = crawledInformation.title;
      }

      if (crawledInformation.totalChapter) {
        comic.chapterCount = +crawledInformation.totalChapter;
        await job.updateProgress(15);
      }

      if (crawledInformation.thumbUrl) {
        comic.thumbImage = Promise.resolve(
          this.updateThumbImageComic(comic, crawledInformation.thumbUrl),
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
    try {
      const { body } = await this.executeCurl(url);

      // Extract the <h1> content with class="title-detail"
      const h1Regex = /<h1[^>]*class="title-detail"[^>]*>(.*?)<\/h1>/;
      const h1Match = h1Regex.exec(body);

      if (!h1Match) throw new Error('Header is not found !!');

      const title = h1Match[1].trim();

      const ulRegex =
        /<ul[^>]*style="[^"]*display:\s*block[^"]*"[^>]*>([\s\S]*?)<\/ul>/;

      // Match the specific <ul>
      const ulMatch = ulRegex.exec(body);

      if (!ulMatch) {
        throw new Error('No <ul> with display:block found.');
      }

      const ulContent = ulMatch[1]; // Content inside the specific <ul>

      // Regex to match <a> tags within the extracted <ul>
      const linkRegex =
        /<a\s+href="([^"]+)"\s+data-id="([^"]+)">Chapter\s+(\d+)<\/a>/g;

      // Array to store the results
      const chapters: InfoExtractedResult$1['chapters'] = [];

      // Extract data from <a> tags within the specific <ul>
      let linkMatch;
      while ((linkMatch = linkRegex.exec(ulContent)) !== null) {
        const item: InfoExtractedResult$1['chapters'][number] = {
          href: linkMatch[1],
          chapterNumber: linkMatch[3],
        };
        await LinkCrawlModel.validateAsync(item);
        chapters.push(item);
      }

      //Extract thumb url
      const thumbImageRegex = /<img[^>]*data-src=["']([^"]*)["']/g;
      const thumbMatch = thumbImageRegex.exec(body);
      if (!thumbMatch || !thumbMatch[1]) {
        throw new Error('Not found thumb url !!');
      }
      const thumbUrl = thumbMatch[1];

      return {
        title,
        totalChapter: chapters.length,
        thumbUrl,
        chapters,
      } satisfies InfoExtractedResult$1;
    } catch (e) {
      throw e;
    }
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
      this.logger.log(
        `[${this.updateComicCrawled.name}]::= Found comic and update what it changed`,
      );

      let refresh: 1 | 0 = 0;

      if (rawData.title != comic.title) {
        comic.title = rawData.title;
        refresh = 1;
      }

      let updateChapters = [];
      if (rawData.totalChapter > lastedChapter) {
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
      this.logger.error(`[${this.updateComicCrawled.name}]::= Fail`);
      this.logger.error(e);
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
  ): Promise<ImageEntity> {
    comic.thumbImage = null;
    this.logger.log('Process crawl image-fe thumb url');
    return this.crawlImageService.handleCrawlThumbUrl([thumbUrl]);
  }

  private async executeCurl(url: string) {
    return new Promise<CrawlComicExecuteCurlResult$1>(
      async (resolve, reject) => {
        exec(
          `curl -s -i ${url} \
            -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
            -H 'accept-language: en-US,en;q=0.9,vi;q=0.8,vi-VN;q=0.7' \
            -H 'cookie: _ga=GA1.1.1791487263.1733478889; location=VN; _location_evoads_=VN; _ip_evoads_=2001%3Aee0%3A4161%3Aa938%3Af651%3A4398%3A651c%3A7e80; _ga_9QE79X1JWX=GS1.1.1733581738.3.0.1733581738.0.0.0; _location=VN; _puTimeAccess_evoads_=1733581738207' \
            -H 'dnt: 1' \
            -H 'priority: u=0, i' \
            -H 'sec-ch-ua: "Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"' \
            -H 'sec-ch-ua-mobile: ?0' \
            -H 'sec-ch-ua-platform: "Linux"' \
            -H 'sec-fetch-dest: document' \
            -H 'sec-fetch-mode: navigate' \
            -H 'sec-fetch-site: same-origin' \
            -H 'sec-fetch-user: ?1' \
            -H 'upgrade-insecure-requests: 1' \
            -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
         `,
          { encoding: 'utf-8' },
          (error, response, stderr) => {
            try {
              if (error) {
                throw new Error(`Error fetching URL: ${url}`, error);
              }

              if (stderr) {
                throw new Error(`Error fetching URL: ${stderr}`);
              }

              // Separate headers and body
              const [headers, body] = response.split('\r\n\r\n', 2);

              // Extract status code
              const statusLine = headers.split('\r\n')[0];
              const statusCode = parseInt(statusLine.split(' ')[1], 10);

              // Check status code
              if (Number.isInteger(statusCode) && statusCode !== 200) {
                throw new Error(`URL response Status Code: ${statusCode}`);
              }

              resolve({
                headers: {
                  original: headers,
                  statusCode,
                },
                body,
              } satisfies CrawlComicExecuteCurlResult$1);
            } catch (error) {
              this.logger.error('Error executing curl:', error);
              reject(error);
            }
          },
        );
      },
    );
  }
}
