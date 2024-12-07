import { RawCrawledChapter } from '@/common';

export interface CrawlComicJobData {
  href: string;
}

/**
 * Cập nhật thông tin cho comic-fe
 */
export interface UpdateComicJobData {
  /**
   *
   * @description là id của comic-fe có tồn tại trong hệ thống
   */
  comicId: number;
  /**
   * @description NewUrl chỉ có giá trị khi muốn thay thế originUrl trong comicSchema
   * @default null
   * @see Comic
   */
  newUrl: string | null;
}

export interface CrawlChapterImages {
  images: RawImage[];
}
export interface RawImage {
  imageUrls: string[];
  position: number;
}

export type ExecuteCurlResult = {
  fileBuffer: Buffer;
  contentType: string;
};

export interface CrawlThumbImage {
  imageUrls: string[];
  goto: string;
}

export interface CrawlChapterData {
  url: string;
  chapNumber: string;
  comicId: number;
  position: number;
}

export type InfoExtractedResult$1 = {
  totalChapter: number;
  thumbUrl: string;
  title: string;
  chapters: Array<RawCrawledChapter>;
};

export type CrawlComicExecuteCurlResult$1 = {
  headers: {
    original: string;
    statusCode: number;
  };
  body: string;
};

export type ExtractChapterInfoResultItem$1 = {
  imageUrls: [string, string];
  position: number;
};

export type ExtractChapterInfoResult$1 = Array<ExtractChapterInfoResultItem$1>;
