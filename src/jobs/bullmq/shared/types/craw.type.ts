import { NullAble } from '@/common';

export type ImageRawDataCrawl = {
  alt: string;
  dataSv1: string;
  dataSv2: string;
};

export type RawCrawledChapter = {
  dataId: string;
  url: string;
  chapNumber: string;
};

export type ComicTagsPre = {
  title: string;
  id: NullAble<string>;
};

export type RawCrawledComic = {
  author: string;
  name: string;
  status: string;
  totalChapter: number;
  tags: string[];
  thumbUrl: string;
  chapters: RawCrawledChapter[];
};

export type UploadMinioResponse = {
  fileUrl: string;
  fileName: string;
  bucketName: string;
};

export type CrawlUploadResponse = (Partial<UploadMinioResponse> & {
  position: number;
  originUrls: string[];
})[];
