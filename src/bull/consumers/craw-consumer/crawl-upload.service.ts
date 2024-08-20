import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HTTPResponse, Page } from 'puppeteer';
import { GDUploadFileRequest, GoogleDriveService } from '@libs/google-drive';
import { ConfigService } from '@nestjs/config';
import { JobUtils } from '@crawl-engine/bull/shared/utils';
import { v1 } from 'uuid';
import { EnvKey } from '@crawl-engine/environment';

@Injectable()
export class CrawlUploadService {
  private logger = new Logger(CrawlUploadService.name);

  constructor(
    private googleDriveService: GoogleDriveService,
    private configService: ConfigService,
  ) {}

  async crawlAndUploadImageToDriver(
    page: Page,
    prefixFileName: string,
    svUrls: string[],
  ) {
    const responseSvData = await this.handleImageUrls(page, svUrls);
    const contentType = responseSvData.headers?.['content-type'];
    const fileName = await this.generateFileName(prefixFileName, contentType);

    const gbUploadResponse = await this.uploadFileToDrive(
      responseSvData.buffer,
      contentType,
      fileName,
    );
    return gbUploadResponse;
  }

  private async uploadFileToDrive(
    file: Buffer,
    contentType: string,
    fileName: string,
    folderId?: string,
  ) {
    try {
      const body = GoogleDriveService.bufferToStream(file);

      const requestUploadFile: GDUploadFileRequest = {
        body: body,
        fileName,
        mimeType: contentType,
        folderId: folderId ?? this.configService.get(EnvKey.G_FOLDER_ID),
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

  private async handleImageUrls(page: Page, imageUrls: string[]) {
    return new Promise<{ buffer: Buffer; headers: Record<string, string> }>(
      async (resolve, reject) => {
        const urlSet = new Set<string>(...imageUrls);
        page.off('response');
        page.off('request');
        let timeoutRequest = null;
        const handlingResponse = async (response: HTTPResponse) => {
          if (
            response.request().resourceType() !== 'image' ||
            response.status() !== HttpStatus.OK ||
            !urlSet.has(response.url())
          ) {
            return;
          }
          this.logger.log('Had response on url ' + response.url());
          if (timeoutRequest) {
            clearTimeout(timeoutRequest);
          }
          resolve({
            buffer: await response.buffer(),
            headers: response.headers(),
          });
          page.off('response', handlingResponse);
        };
        page.on('response', handlingResponse);
        timeoutRequest = setTimeout(() => {
          this.logger.error(
            `Timeout dont have request on ${JSON.stringify(imageUrls)} `,
          );
          page.off('response', handlingResponse);
          reject(`Timeout dont have request on ${JSON.stringify(imageUrls)}`);
        }, 10000 * urlSet.size);
        await this.constructHTMLImage(urlSet, page);
      },
    );
  }

  private constructHTMLImage(imageUrls: Set<string>, page: Page) {
    return page.evaluate((urls) => {
      return new Promise<void>((resolve, reject) => {
        const imgElement = document.createElement('img');
        imgElement.setAttribute('referrerpolicy', 'origin');
        imgElement.addEventListener('load', (e) => {
          console.log('Loaded Image', e);
          resolve();
        });
        imgElement.addEventListener('error', (ev) => {
          if (urls.size == 0) {
            console.error(imgElement.src);
            reject(ev);
            return;
          }
          urls.delete(imgElement.src);
          imgElement.src = urls[0];
        });

        // Assign URL
        imgElement.src = urls[0];
      });
    }, imageUrls);
  }

  private async generateFileName(prefixFileName: string, contentType: string) {
    const extension = JobUtils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new Error('Unsupported content type');
    }
    const hash = v1();
    return `${prefixFileName}-${hash}.${extension}`;
  }
}
