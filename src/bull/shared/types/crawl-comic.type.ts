export interface CrawlComicJobData {
  href: string;
}

export interface CrawlChapterImages {
  chapterId: string;
  goto: string;
  images: {
    imageUrls: string[];
    position: number;
  }[];
}

export interface CrawlThumbImage {
  imageUrls: string[];
  goto: string;
}

export interface CrawlChapterData {
  url: string;
  dataId: string;
  chapNumber: string;
  comicId: string;
  position: number;
}
