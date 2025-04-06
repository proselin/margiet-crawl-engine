export type RawCrawledChapter = {
  href: string;
  chapterNumber: string;
};

export type UploadMinioResponse = {
  fileUrl: string;
  fileName: string;
  bucketName: string;
};

export type UploadDriveResponse = {
  fileUrl: string;
  fileName: string;
  parentFolderId: string;
};

export type CrawlUploadResponse = Array<
  Partial<UploadMinioResponse> & {
    position: number;
    originUrls: string[];
  }
>;

export type ResultHandleImageUrls$V2 = {
  contentType: string;
  buffer: Buffer;
};
