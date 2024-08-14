import { getFileExtensionFromContentType } from '@crawl-engine/common';
import { Injectable, Logger } from '@nestjs/common';
import { ImageService } from '@crawl-engine/image/image.service';
import { Job } from 'bullmq';
import { CrawlImageData } from '@crawl-engine/bull/shared/types';
import { GDUploadFileRequest, GoogleDriveService } from '@libs/google-drive';
import { ConfigService } from '@nestjs/config';
import { EnvKey } from '@crawl-engine/environment';
import { InjectPage } from 'nestjs-puppeteer';
import { Page } from 'puppeteer';

@Injectable()
export class CrawlImageService {
  private logger = new Logger(CrawlImageService.name);

  constructor(
    private imageService: ImageService,
    private googleDriveService: GoogleDriveService,
    private configService: ConfigService,
    @InjectPage('page-1')
    private page: Page,
  ) {}

  async handleCrawlJob(job: Job<CrawlImageData>) {
    try {
      this.logger.log(`Start crawl job ${job.token}}`);
      const imageData = job.data;
      const newDriveImage = await this.uploadFileToDrive(imageData);
      await this.imageService.findByIdAndUpdate(
        imageData.imageId,
        {
          url: newDriveImage.fileUrl,
        },
        { upsert: true },
      );
    } catch (e) {
      this.logger.error(e);
      console.trace(e);
      throw e;
    }
  }

  private async uploadFileToDrive(imageData: CrawlImageData) {
    try {
      const response: any = await new Promise(async (resolve, reject) => {
        const res1 = await this.page.goto(imageData.dataSv1).then((res) => {
          if (res.status() == 200) {
            resolve(res);
          }
          return null;
        });
        if (!res1) {
          this.page.goto(imageData.dataSv2).then((res) => {
            if (res.status() == 200) {
              resolve(res);
            }
            reject(res);
          });
        }
      });
      const contentType = response?.headers?.['content-type'];
      const extension = getFileExtensionFromContentType(contentType);
      if (!extension) {
        throw new Error('Unsupported content type');
      }
      const fileName = `chapter-${imageData.chapterId}-img-${imageData.position}-${Date.now()}.${extension}`;

      const body = GoogleDriveService.bufferToStream(await response.buffer());

      const requestUploadFile: GDUploadFileRequest = {
        body: body,
        fileName,
        mimeType: contentType,
        folderId: this.configService.get(EnvKey.G_FOLDER_ID),
      };

      const result = this.googleDriveService.uploadFile(requestUploadFile);

      this.logger.log(
        'File uploaded to Google Drive: ' + JSON.stringify(result),
      );
      return result;
    } catch (e) {
      throw e;
    }
  }
}
