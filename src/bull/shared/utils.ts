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

  public static getFileExtensionFromContentType(
    contentType: string,
  ): string | null {
    switch (contentType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/gif':
        return 'gif';
      case 'image/webp':
        return 'webp';
      case 'image/bmp':
        return 'bmp';
      case 'image/tiff':
        return 'tiff';
      case 'image/svg+xml':
        return 'svg';
      default:
        return null; // Unsupported content type
    }
  }
}
