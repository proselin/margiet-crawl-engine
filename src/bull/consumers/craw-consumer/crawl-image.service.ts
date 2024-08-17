import { JobConstant } from '@crawl-engine/bull/shared';
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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { InjectBrowser, InjectPage } from 'nestjs-puppeteer';
import { Browser, Page } from 'puppeteer';
import { HttpException } from '@nestjs/common/exceptions/http.exception';

@Injectable()
export class CrawlImageService implements BeforeApplicationShutdown {
  private logger = new Logger(CrawlImageService.name);

  constructor(
    private imageService: ImageService,
    private googleDriveService: GoogleDriveService,
    private configService: ConfigService,
    @InjectPage(JobConstant.CRAWL_IMAGE_PAGE_NAME)
    private page: Page,
    @InjectBrowser()
    private browser: Browser,
  ) {}

  async handleCrawlJob(job: Job<CrawlImageData>) {
    try {
      this.logger.log(`Start crawl job image ${job.token}}`);
      //Setup response listener
      if (this.page.isClosed()) {
        this.page = await this.browser.newPage();
      }
      return new Promise<void>(async (resolve) => {
        let count = 0;
        let timeoutRerun;
        const retry = 3;
        let currentRetryCount = 0;

        this.page.on('response', async (response) => {
          if (
            response.request().resourceType() !== 'image' ||
            response.status() !== HttpStatus.OK
          ) {
            return;
          }
          const url = response.url();
          const currentRawResponseImage = job.data.imageData.find((raw) => {
            return raw.dataSv1 == url || raw.dataSv2 == url;
          });
          if (!currentRawResponseImage) {
            return;
          }
          this.logger.log('Crawl Data: ' + url);
          const file = await response.buffer();
          const contentType = response.headers()?.['content-type'];
          const fileName = await this.createFileName(
            contentType,
            job.data.chapterId,
            currentRawResponseImage.position,
          );
          const gbUploadResponse = await this.uploadFileToDrive(
            file,
            contentType,
            fileName,
          );
          await this.updateImageDocument(
            currentRawResponseImage.imageId,
            gbUploadResponse.fileUrl,
          );
          count++;
          if (timeoutRerun) {
            clearTimeout(timeoutRerun);
            if (retry != currentRetryCount) {
              setTimeout(() => {
                this.triggerLoad(this.page);
              }, 6000);
            } else {
              throw new HttpException(
                {
                  message: 'Crawl Image could not be retrieved',
                },
                500,
              );
            }
            currentRetryCount++;
          }
          if (count == job.data.imageData.length) {
            clearTimeout(timeoutRerun);
            resolve();
          }
        });
        await this.page.goto(job.data.chapterUrl, {
          timeout: 0,
          waitUntil: 'load',
        });
        await JobUtils.waitTillHTMLRendered(this.page);
        await this.triggerLoad(this.page);
      });
    } catch (e) {
      this.logger.error(e);
      console.trace(e);
      throw e;
    }
  }

  async triggerLoad(page: Page) {
    await page.$$eval('.page-chapter img.lozad', (img) => {
      /*
        Observer is create from lozad lib
        See lozad on npm for more
       */

      img.forEach((node) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        observer.triggerLoad(node);
        setTimeout(() => {
          node.scrollIntoView();
        }, 1000);
      });
    });
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

  private async createFileName(
    contentType: string,
    chapterId: string,
    position: number,
  ) {
    const extension = JobUtils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new Error('Unsupported content type');
    }
    const startWith = `chapter${chapterId}-img-${position}`;
    const hash = Date.now() + Math.random();
    return `${startWith}-${hash}.${extension}`;
  }

  private async updateImageDocument(imageId: string, uploadedUrl: string) {
    try {
      await this.imageService.findByIdAndUpdate(
        imageId,
        {
          url: uploadedUrl,
        },
        { upsert: true },
      );
      this.logger.log(
        `[${this.uploadFileToDrive.name}]: Update image url for id: ${imageId}`,
      );
    } catch (e) {
      this.logger.error(
        `[${this.uploadFileToDrive.name}]: Failed to update image ${imageId}`,
      );
      throw e;
    }
  }
}
