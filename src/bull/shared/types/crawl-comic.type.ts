export interface CrawlComicJobData {
  href: string;
}

export type CrawlImageData = CrawlThumbImage | CrawlChapterImages;

export interface CrawlChapterImages {
  isCrawlThumb: false;
  chapterId: string;
  goto: string;
  images: {
    imageUrls: string[];
    position: number;
  }[];
}

export interface CrawlThumbImage {
  isCrawlThumb: true;
  imageUrls: string[];
  comicId: string;
  goto: string;
}

export interface CrawlChapterData {
  url: string;
  dataId: string;
  chapNumber: string;
  comicId: string;
  position: number;
}
