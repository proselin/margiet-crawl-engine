export interface CrawlComicJobData {
  href: string;
}

export type CrawlImageData = CrawlThumbImage | CrawlChapterImages;

export interface CrawlChapterImages {
  isCrawlThumb: false;
  imageUrls: string[];
  chapterId: string;
  position: number;
  goto: string;
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
