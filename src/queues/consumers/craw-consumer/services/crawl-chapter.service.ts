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
import { CrawlChapterResultModel } from '../../../../models/jobs';

@Injectable()
export class CrawlChapterService {
  private readonly logger = new Logger(CrawlChapterService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private comicRepository: Repository<ComicEntity>,
    private readonly crawlImageService: CrawlImageService,
    private dataSource: DataSource,
  ) {}

  async crawlChapterInfo(job: Job<CrawlChapterData>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {domain, image} = await this.extractChapterInfo(job.data.url);

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
          domain
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
    const { body } = await this.executeCurl(url);
    const domain = (new URL(url)).origin
    const imageRegex =
      /data-sv1=['"]([^'"]*)['"][^>]*data-sv2=['"]([^'"]*)['"]/g;
    const results: ExtractChapterInfoResult$1 = {
      image : [],
      domain : domain,
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

  private async executeCurl(url: string) {
    this.logger.log(`CURL with url ${url}`);
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
              if (error || stderr) {
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
