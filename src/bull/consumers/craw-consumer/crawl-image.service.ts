import { CrawlImageData } from '@crawl-engine/bull/shared/types';
import { JobUtils } from '@crawl-engine/bull/shared/utils';
import { EnvKey } from '@crawl-engine/environment';
import { ImageService } from '@crawl-engine/image/image.service';
import { GDUploadFileRequest, GoogleDriveService } from '@libs/google-drive';
import {
  BeforeApplicationShutdown,
  HttpStatus,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { InjectBrowser, InjectPage } from 'nestjs-puppeteer';
import { Browser, HTTPRequest, HTTPResponse, Page } from 'puppeteer';
import { v1 } from 'uuid';
import { JobConstant } from '@crawl-engine/bull/shared';
import { ChapterService } from '@crawl-engine/chapter/chapter.service';
import { Image as ImageSchema } from '@crawl-engine/image/image.schema';

@Injectable()
export class CrawlImageService
  implements BeforeApplicationShutdown, OnApplicationBootstrap
{
  private logger = new Logger(CrawlImageService.name);

  constructor(
    private imageService: ImageService,
    private googleDriveService: GoogleDriveService,
    private chapterService: ChapterService,
    private configService: ConfigService,
    @InjectPage(JobConstant.CRAWL_IMAGE_PAGE_NAME)
    private page: Page,
    @InjectBrowser()
    private browser: Browser,
  ) {}

  onApplicationBootstrap() {}

  async handleCrawlJob(job: Job<CrawlImageData>) {
    try {
      this.logger.log(
        `Process crawl job image ${job.token} with ChapterUrl ${job.data.chapterUrl}`,
      );
      //Setup response listener
      if (!this.page || this.page?.isClosed()) {
        this.page = await this.browser.newPage();
      }
      await this.abortAllOutRequest(job.data.chapterUrl);
      await this.page.goto(job.data.chapterUrl, {
        timeout: 0,
        waitUntil: 'domcontentloaded',
      });
      const imgSvData = await this.page.$$eval('.page-chapter img', (imgs) =>
        imgs.map((img) => {
          return {
            sv1: img.dataset.sv1,
            sv2: img.dataset.sv2,
          };
        }),
      );
      await this.page.evaluate('document.write("")');
      await this.page.setRequestInterception(false);
      this.page.off('request');
      for (let index = 0; index < imgSvData.length; index++) {
        const { sv1, sv2 } = imgSvData[index];
        const responseSvData = await this.handleImageSvData(sv1, sv2);
        const contentType = responseSvData.headers?.['content-type'];
        const fileName = await this.generateFileName(
          contentType,
          job.data.chapterId,
          index,
        );
        const gbUploadResponse = await this.uploadFileToDrive(
          responseSvData.buffer,
          contentType,
          fileName,
        );
        const newImage = await this.createImageDocument(
          gbUploadResponse.fileUrl,
        );
        await this.updateChapterImages(newImage, job.data.chapterId);
      }
    } catch (e) {
      this.logger.error(e);
      console.trace(e);
      throw e;
    }
  }

  async updateChapterImages(image: ImageSchema, chapterId: string) {
    try {
      return await this.chapterService.findByIdAndUpdate(
        { _id: chapterId },
        { $push: { images: image } },
      );
    } catch (e) {
      throw e;
    }
  }

  async uploadFileToDrive(file: Buffer, contentType: string, fileName: string) {
    try {
      const body = GoogleDriveService.bufferToStream(file);

      const requestUploadFile: GDUploadFileRequest = {
        body: body,
        fileName,
        mimeType: contentType,
        folderId: this.configService.get(EnvKey.G_FOLDER_ID),
      };

      const result =
        await this.googleDriveService.uploadFile(requestUploadFile);

      this.logger.log(
        `[${this.uploadFileToDrive.name}]:: ` +
          'File uploaded to Google Drive: ' +
          JSON.stringify(result),
      );
      return result;
    } catch (e) {
      throw e;
    }
  }

  async beforeApplicationShutdown() {
    await this.browser.close();
  }

  private async abortAllOutRequest(originURl: string) {
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      const url = request.url();
      if (url == originURl) request.continue();
      else request.abort('internetdisconnected');
    });
  }

  private addImageElement(sv1: string, sv2: string) {
    return this.page.evaluate(
      (sv1, sv2) => {
        return new Promise<void>((resolve, reject) => {
          const imgElement = document.createElement('img');
          imgElement.setAttribute('referrerpolicy', 'origin');
          imgElement.addEventListener('load', (e) => {
            console.log(e);
            resolve();
          });
          imgElement.addEventListener('loadeddata', console.log);
          imgElement.addEventListener('error', (ev) => {
            if (imgElement.src == sv2) {
              console.error(imgElement.src);
              reject(ev);
              return;
            }
            console.log(sv2);
            imgElement.src = sv2;
          });

          // Assign URL
          imgElement.src = sv1;
        });
      },
      sv1,
      sv2,
    );
  }

  private async generateFileName(
    contentType: string,
    chapterId: string,
    position: number,
  ) {
    const extension = JobUtils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new Error('Unsupported content type');
    }
    const startWith = `c-${chapterId}-i-${position}`;
    const hash = v1();
    return `${startWith}-${hash}.${extension}`;
  }

  private async createImageDocument(uploadedUrl: string) {
    try {
      const rs = await this.imageService.createOne({
        url: uploadedUrl,
      });
      this.logger.log(
        `[${this.uploadFileToDrive.name}]: create image id: ${rs.id} and url ${uploadedUrl}`,
      );
      return rs as ImageSchema;
    } catch (e) {
      this.logger.error(
        `[${this.uploadFileToDrive.name}]: Failed to create image with uploaded url ${uploadedUrl}`,
      );
      throw e;
    }
  }

  private async handleImageSvData(sv1: string, sv2: string) {
    return new Promise<{ buffer: Buffer; headers: Record<string, string> }>(
      async (resolve, reject) => {
        this.page.off('response');
        let timeoutRequest = null;
        const watchForRequest = async (request: HTTPRequest) => {
          if (request.url() != sv1 && request.url() != sv2) {
            return;
          }
          if (timeoutRequest) {
            clearTimeout(timeoutRequest);
          }
          this.logger.log('Had request on url ' + request.url());
        };
        const handlingResponse = async (response: HTTPResponse) => {
          if (
            response.request().resourceType() !== 'image' ||
            response.status() !== HttpStatus.OK
          ) {
            return;
          }
          const url = response.url();
          if (url != sv1 && url != sv2) {
            return;
          }
          resolve({
            buffer: await response.buffer(),
            headers: response.headers(),
          });
          this.page.off('request', watchForRequest);
          this.page.off('response', handlingResponse);
        };

        this.page.once('request', watchForRequest);
        this.page.once('response', handlingResponse);
        timeoutRequest = setTimeout(() => {
          this.logger.error(
            `Timeout dont have request on {"sv1":${sv1}, sv2:${sv2}} `,
          );
          this.page.off('request', watchForRequest);
          this.page.off('response', handlingResponse);
          reject(`Timeout dont have request on {"sv1":${sv1}, sv2:${sv2}}`);
        }, 60000);
        await this.addImageElement(sv1, sv2);
      },
    );
  }
}
