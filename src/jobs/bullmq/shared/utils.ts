import { extname } from 'path';
import { Page } from 'puppeteer';

export class JobUtils {
  public static async waitTillHTMLRendered(page: Page, timeout = 30000) {
    const checkDurationMsecs = 1000;
    const maxChecks = timeout / checkDurationMsecs;
    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;
    const minStableSizeIterations = 3;

    while (checkCounts++ <= maxChecks) {
      const html = await page.content();
      const currentHTMLSize = html.length;

      // const bodyHTMLSize = await page.evaluate(
      //   () => document.body.innerHTML.length,
      // );

      // console.log(
      //   'last: ',
      //   lastHTMLSize,
      //   ' <> curr: ',
      //   currentHTMLSize,
      //   ' body html size: ',
      //   bodyHTMLSize,
      // );

      if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
        countStableSizeIterations++;
      else countStableSizeIterations = 0; //reset the counter

      if (countStableSizeIterations >= minStableSizeIterations) {
        console.log('Page rendered fully..');
        break;
      }

      lastHTMLSize = currentHTMLSize;
      await new Promise((_) => setTimeout(_, checkDurationMsecs));
    }
  }

  public static extensionMap: { [key: string]: string } = {
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
  };

  public static contentTypeMap: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/svg+xml': 'svg',
  };

  public static getFileExtensionFromContentType(
    contentType: string,
  ): string | null {
    return JobUtils.contentTypeMap[contentType] || null;
  }

  public static getContentTypeFromFileExtension(
    extension: string,
  ): string | null {
    return JobUtils.extensionMap[extension] || null;
  }

  public static getFileExtensionFromUrl(imageUrl: string): string | null {
    try {
      // Parse the URL
      const parsedUrl = new URL(imageUrl);

      // Extract the pathname
      const pathname = parsedUrl.pathname;

      // Get the file extension from the pathname
      const extension = extname(pathname);

      // Remove the leading dot and return the extension or null if none
      return extension ? extension.slice(1) : null;
    } catch (error) {
      // Handle any errors (e.g., invalid URL)
      console.error('Invalid URL:', error);
      return null;
    }
  }
}
