import { NullAble } from '@/common';

export type ImageRawDataCrawl = {
  alt: string;
  dataSv1: string;
  dataSv2: string;
};

export type ComicChapterPre = {
  dataId: string;
  url: string;
  chapNumber: string;
};

export type ComicTagsPre = {
  title: string;
  id: NullAble<string>;
};

export type CrawlRawData = {
  author: string;
  name: string;
  status: string;
  totalChapter: number;
  tags: string[];
  thumbUrl: string;
  chapters: ComicChapterPre[];
};

export type UploadMinioResponse = {
  fileUrl: string;
  fileName: string;
  bucketName: string;
};
