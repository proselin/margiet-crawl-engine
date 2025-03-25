import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

interface INettruyenChapterListResponseItem {
  comic_id: number;
  chapter_id: number;
  chapter_name: string;
  chapter_slug: string;
  updated_at: string;
  chapter_num: number;
  data_cdn: number;
  data_error: number;
  image_num: number;
  chapter_images: any;
  webp: number;
  watermask: number;
  reported_at: string;
  cdn_sv: number;
  image_type: string;
}

type NettruyenGetChapterListResponse = {
  data: INettruyenChapterListResponseItem[];
};

@Injectable()
export class NettruyenHttpService {
  private logger = new Logger(NettruyenHttpService.name);

  constructor(private httpService: HttpService) {}

  private addHeader() {
    return {
      referer: '',
    };
  }

  get(url: string) {
    return firstValueFrom(
      this.httpService.get(url, { headers: this.addHeader() }),
    );
  }

  getImages(url: string, domain: string) {
    return firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'allow-origin': '*',
          accept: '*/*',
          origin: domain,
          referer: domain + '/',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
        },
        responseType: 'arraybuffer',
      }),
    );
  }

  getChapterList(domain: string, slug: string, comicId: string) {
    this.logger.log(
      `[getChapterList] ${domain}/Comic/Services/ComicService.asmx/ChapterList?slug=${slug}&comicId=${comicId}`,
    );
    return firstValueFrom(
      this.httpService.get<NettruyenGetChapterListResponse>(
        `${domain}/Comic/Services/ComicService.asmx/ChapterList?slug=${slug}&comicId=${comicId}`,
        {
          headers: {
            'allow-origin': '*',
            accept: '*/*',
            origin: domain,
            referer: domain + '/',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
          },
        },
      ),
    );
  }
}
