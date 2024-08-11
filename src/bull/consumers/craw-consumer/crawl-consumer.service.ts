import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { InfoFromPageChapter } from '@crawl-engine/bull/shared';
import { Job } from 'bullmq';
import { CrawlChapterJobDataDto, CrawlChapterJobResultDto } from '@crawl-engine/bull/shared/dto';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { ImageService } from '@crawl-engine/image/image.service';
import { Image } from '@crawl-engine/image/image.schema';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getFileExtensionFromContentType } from '@crawl-engine/common';

@Injectable()
export class CrawlConsumerService {
  private logger = new Logger(CrawlConsumerService.name);

  constructor(private chapterService: ChapterService, private imageService: ImageService) {

  }

  async handleCrawlJob(job: Job<CrawlChapterJobDataDto, CrawlChapterJobResultDto, string>) {
    try {
      this.logger.log('Start CrawlJob');
      const chapterRawData = await this.getChapterDataFromUrl(job.data.chapterURL);
      const chapterImages: Image[] = [];
      for (let i = 0; i < chapterRawData.length; i++) {
        const image = new Image();
        image.position = i;
        image.bucket = null;
        image.url = await this.downloadImage(chapterRawData[i], i);
        chapterImages.push(await this.imageService.createOne(image));
        await job.updateProgress((i / chapterRawData.length) * 100);
      }
      await this.chapterService.findByIdAndUpdate(<string>job.data.docId, {
        images: chapterImages,
      }, { upsert: true });
      await job.updateProgress(100);
    } catch (e) {
      this.logger.error('Fail job token ' + job.token);
      this.logger.error(e);
    }
  }

  /**
   *
   * @param imageData
   * @param index
   * @return path where image is store
   * @private
   */
  private async downloadImage(imageData: InfoFromPageChapter, index: number): Promise<string> {
    try {
      const saveDirectory = path.join(process.cwd(), 'assets/images'); // Adjust to your desired directory

      // Ensure the directory exists
      if (!fs.existsSync(saveDirectory)) {
        fs.mkdirSync(saveDirectory, { recursive: true });
      }

      // Create a readable stream from the URL using axios
      const response = await axios({
        url: imageData.dataSv1,
        method: 'GET',
        responseType: 'stream',
      }).catch(() => {
        return axios({
          url: imageData.dataSv2,
          method: 'GET',
          responseType: 'stream',
        });
      });

      // Extract the content type and determine the file extension
      const contentType = response.headers['content-type'];
      const extension = getFileExtensionFromContentType(contentType);
      if (!extension) {
        throw new Error('Unsupported content type');
      }

      // Generate a unique file name
      const fileName = `chapter-${index}-${Date.now()}.${extension}`;
      const savePath = path.join(saveDirectory, fileName);

      // Create a writable stream to the file path where the image will be saved
      const writer = fs.createWriteStream(savePath);

      // Pipe the axios stream to the writable stream
      response.data.pipe(writer);

      // Return a promise that resolves when the file is fully written
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(savePath));
        writer.on('error', reject);
      });

    } catch (error) {
      console.error('Error downloading the image:', error);
      throw new Error('Failed to download image');
    }
  }

  private async getChapterDataFromUrl(url: string): Promise<InfoFromPageChapter[]> {
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
  ): InfoFromPageChapter {

    const alt = pageChapterContent.match(/(?<=alt=["'])(.+?)(?=["'])/g)[0]
    const dataSv1 = pageChapterContent.match(/(?<=data-sv1=["'])(.+?)(?=['"])/g)[0]
    const dataSv2 = pageChapterContent.match(/(?<=data-sv2=["'])(.+?)(?=["'])/g)[0]
    return {
      alt, dataSv1, dataSv2
    }
  }
}
