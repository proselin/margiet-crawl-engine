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

    return await this.uploadFileToDrive(
      responseSvData.buffer,
      contentType,
      fileName,
    );
  }

  async crawlAndUploadMulti(
    page: Page,
    prefixFileName: string,
    data: {
      imageUrls: string[];
      position: number;
    }[],
  ): Promise<any[]> {
    page.off('response');
    page.off('request');

    return new Promise(async (resolve) => {
      const flags = data.map((z) => {
        const urlFlags: Record<string, boolean> = {};
        z.imageUrls.forEach((url) => (urlFlags[url] = true));
        return {
          position: z.position,
          urlFlags,
          isAllCheck: false,
          GUrl: null,
        };
      });
      page.on('response', async (response) => {
        const currentFlag = flags.find((flag) =>
          flag.urlFlags.hasOwnProperty(response.url()),
        );
        if (
          response.request().resourceType() !== 'image' ||
          response.status() !== HttpStatus.OK
        ) {
          currentFlag.urlFlags[response.url()] = false;
          return;
        }
        const contentType = response.headers?.['content-type'];
        const fileName = await this.generateFileName(
          prefixFileName,
          contentType,
        );
        currentFlag.urlFlags[response.url()] = true;
        currentFlag.GUrl = await this.uploadFileToDrive(
          await response.buffer(),
          contentType,
          fileName,
        );
        if (
          flags.every((flag) => {
            if (flag.isAllCheck) {
              return true;
            }
            if (
              Object.values(flag.urlFlags).filter((val) => !!val).length > 0
            ) {
              flag.isAllCheck = true;
              return true;
            }
            return false;
          })
        ) {
          resolve(flags);
        }
      });
      for (const w of data) {
        await this.constructHTMLImage(w.imageUrls, page);
      }
    });
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
        const urlSet = new Set<string>(imageUrls);
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
        };
        page.on('response', handlingResponse);
        timeoutRequest = setTimeout(
          () => {
            this.logger.error(
              `Timeout dont have request on ${JSON.stringify(imageUrls)} `,
            );
            page.off('response', handlingResponse);
            reject(`Timeout dont have request on ${JSON.stringify(imageUrls)}`);
          },
          20000 * (urlSet.size || 1),
        );
        await this.constructHTMLImage(imageUrls, page);
      },
    );
  }

  private constructHTMLImage(imageUrls: string[], page: Page) {
    return page.evaluate((urls) => {
      return new Promise<void>((resolve, reject) => {
        const imgElement = document.createElement('img');
        imgElement.setAttribute('referrerpolicy', 'origin');
        imgElement.addEventListener('load', (e) => {
          console.log('Loaded Image', e);
          resolve();
        });
        imgElement.addEventListener('error', (ev) => {
          if (urls.length == 0) {
            console.error(imgElement.src);
            reject(ev);
            return;
          }
          urls.splice(0, 1);
          imgElement.src = urls[0];
        });

        // Assign URL
        imgElement.src = urls[0];
      });
    }, Array.from(imageUrls));
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
