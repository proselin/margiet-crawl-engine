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
  comicId: string;
  /**
   * @description NewUrl chỉ có giá trị khi muốn thay thế originUrl trong comicSchema
   * @default null
   * @see Comic
   */
  newUrl: string | null;
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
