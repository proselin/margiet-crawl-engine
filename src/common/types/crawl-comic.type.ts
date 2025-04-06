import { RawCrawledChapter } from "./craw.type";
import { ImageType } from "../constant/image";

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
  thumbUrl: string;
  title: string;
  chapters: Array<RawCrawledChapter>;
  comicId: string;
  slug: string;
  domain: string;
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

export type ExtractChapterInfoResult$1 = {
  image: Array<ExtractChapterInfoResultItem$1>;
  domain: string;
};

export interface IResponseGetChapterList {
  data: {
    comic_id: number;
    chapter_id: number;
    chapter_name: string;
    chapter_slug: string;
    updated_at: string;
    chapter_num: number;
    data_cdn: number;
    webp: number;
    reported_at: string;
    cdn_sv: number;
    image_type: string;
    image_num: number;
    // Not by response
    chapter_link: string;
  }[];
}

export interface CrawlImageJobData {
  domain: string;
  dataUrls: string[];
  position: number;
  type: ImageType;
  comicId?: number;
  chapterId?: number;
}
