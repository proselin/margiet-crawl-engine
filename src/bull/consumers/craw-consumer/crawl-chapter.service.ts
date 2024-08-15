import { ImageRawDataCrawl } from '@crawl-engine/bull/shared';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { Image } from '@crawl-engine/image/image.schema';
import { ImageService } from '@crawl-engine/image/image.service';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { Job } from 'bullmq';
import {
  CrawlChapterData,
  RawImageDataPushJob,
} from '@crawl-engine/bull/shared/types';
import { CrawlProducerService } from '@crawl-engine/bull/producers/crawl-producer';

@Injectable()
export class CrawlChapterService {
  private logger = new Logger(CrawlChapterService.name);

  constructor(
    private chapterService: ChapterService,
    private imageService: ImageService,
    private crawlProducerService: CrawlProducerService,
  ) {}

  async handleCrawlJob(job: Job<CrawlChapterData>) {
    try {
      this.logger.log('Start CrawlJob');

      //#region investigate data take 10%
      this.logger.log('Investigate Chapter data >>');
      const imageRawDataCrawls = await this.getChapterDataFromUrl(
        job.data.chapterURL,
      );
      const chapterImages: string[] = [];
      const crawlImageJobRequestData: RawImageDataPushJob[] = [];
      for (let i = 0; i < imageRawDataCrawls.length; i++) {
        const image = new Image();
        image.position = i;
        image.url = null;
        const newImage = await this.imageService.createOne(image);

        chapterImages.push(newImage.id);

        crawlImageJobRequestData.push({
          ...imageRawDataCrawls[i],
          position: i,
          imageId: newImage.id,
        });
      }
      await this.chapterService.findByIdAndUpdate(
        <string>job.data.chapterId,
        {
          images: chapterImages,
        },
        { upsert: true },
      );
      await this.crawlProducerService.addCrawlImageJobs(
        crawlImageJobRequestData,
        job.data.chapterURL,
        job.data.chapterId,
      );
    } catch (e) {
      this.logger.error('Fail job token ' + job.token);
      this.logger.error(e);
    }
  }

  private async getChapterDataFromUrl(
    url: string,
  ): Promise<ImageRawDataCrawl[]> {
    const htmlResponse = await axios.get<null, AxiosResponse<string, string>>(
      url,
    );
    const htmlPlainText = htmlResponse.data;

    const pageChapterMatch =
      htmlPlainText.match(
        /<div class=['"]page-chapter[^>]*>([\s\S]*?)<\/div>/g,
      ) ?? [];
    const rs = [];
    for (const pageChapter of pageChapterMatch) {
      rs.push(this.extractImageDataFromChapterPage(pageChapter));
    }
    return rs;
  }

  private extractImageDataFromChapterPage(
    pageChapterContent: string,
  ): ImageRawDataCrawl {
    const alt = pageChapterContent.match(/(?<=alt=["'])(.+?)(?=["'])/g)[0];
    const dataSv1 = pageChapterContent.match(
      /(?<=data-sv1=["'])(.+?)(?=['"])/g,
    )[0];
    const dataSv2 = pageChapterContent.match(
      /(?<=data-sv2=["'])(.+?)(?=["'])/g,
    )[0];
    return {
      alt,
      dataSv1,
      dataSv2,
    };
  }
}
