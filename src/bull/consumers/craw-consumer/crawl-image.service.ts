import { JobConstant } from '@crawl-engine/bull/shared';
import {
  CrawlImageData,
  RawImageDataPushJob,
} from '@crawl-engine/bull/shared/types';
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
        await this.setupRequestInterceptor();
        this.listenToResponse(
          job.data.imageData,
          job.data.chapterId,
          job.token,
          resolve,
        );
        await this.page.goto(job.data.chapterUrl, {
          timeout: 0,
          waitUntil: 'networkidle0',
        });
        await this.triggerLoad(this.page);
      });
    } catch (e) {
      this.logger.error(e);
      console.trace(e);
      throw e;
    }
  }

  listenToResponse(
    images: RawImageDataPushJob[],
    chapterId: string,
    token: string,
    resolve: Function,
  ) {
    // Count which image has been crawled
    // From 1 -> image.length
    let crawledImageCount = 0;
    this.page.on('response', async (response) => {
      if (
        response.request().resourceType() !== 'image' ||
        response.status() !== HttpStatus.OK
      ) {
        return;
      }
      const url = response.url();
      const currentRawResponseImage = this.getImageRawDataByUrl(url, images);
      if (!currentRawResponseImage) {
        return;
      }
      this.logger.log('Has response image url : ' + url);
      const file = await response.buffer();
      const contentType = response.headers()?.['content-type'];
      const fileName = await this.createFileName(
        contentType,
        chapterId,
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
      crawledImageCount++;
      if (crawledImageCount == images.length) {
        await this.page.close();
        this.logger.log(
          `Crawl Complete ${images.length} images with token ${token}`,
        );
        this.logger.log(`Close page`);
        resolve();
      }
    });
  }

  getImageRawDataByUrl(imageUrl: string, images: RawImageDataPushJob[]) {
    return (
      images.find((raw) => {
        return raw.dataSv1 == imageUrl || raw.dataSv2 == imageUrl;
      }) ?? null
    );
  }

  async setupRequestInterceptor() {
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      const url = request.url();
      if (url.match(/ads.mxhnkn.pro|facebook|affiliateBanner|.gif/g)) {
        request.abort('aborted');
      } else request.continue();
    });
  }

  async triggerLoad(page: Page) {
    await page.$$eval('.page-chapter img.lozad', async (imgs) => {
      /*
        Observer is create from lozad lib
        See lozad on npm for more
       */
      for (const node of imgs) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        observer.triggerLoad(node);
        await new Promise((_) => setTimeout(_, 1000));
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
