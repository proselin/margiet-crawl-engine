import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { InfoFromPageChapter } from '@crawl-engine/bull/shared';

@Injectable()
export class CrawlConsumerService {
  private logger = new Logger(CrawlConsumerService.name);

  async getImageFromPath(path: string): Promise<InfoFromPageChapter[]> {
    const htmlResponse = await axios.get<null, AxiosResponse<string, string>>(
      path,
    );
    const htmlPlainText = htmlResponse.data;

    const pageChapterMatch =
      htmlPlainText.match(
        /<div class='page-chapter'[^>]*>([\s\S]*?)<\/div>/g,
      ) ?? [];
    const rs = [];
    for (const pageChapter of pageChapterMatch) {
      rs.push(this.extractInformationFromPageChapter(pageChapter));
    }
    return rs;
  }

  extractInformationFromPageChapter(
    pageChapterContent: string,
  ): InfoFromPageChapter {
    const altMatch = pageChapterContent.match(/alt='(.*?)'/);
    const dataSv1Match = pageChapterContent.match(/data-sv1='(.*?)'/);
    const dataSv2Match = pageChapterContent.match(/data-sv2='(.*?)'/);

    const alt = altMatch ? altMatch[1] : '';
    const dataSv1 = dataSv1Match ? dataSv1Match[1] : '';
    const dataSv2 = dataSv2Match ? dataSv2Match[1] : '';

    return {
      alt,
      dataSv1,
      dataSv2,
    };
  }
}
