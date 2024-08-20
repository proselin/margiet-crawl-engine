import { Browser, Page } from 'puppeteer';

export class PupperteerUtils {
  static ConnectToPage(browser: Browser, page: Page) {
    if (!page || !page.isClosed()) {
      return browser.newPage();
    }
    return page;
  }
}
