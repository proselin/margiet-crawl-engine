export interface IExtractChapterInfoResult$1 {
  images: {
    imageUrls: string[];
    position: number;
  }[];
  domain: string;
}

export type IExtractImageResult$1 =
  IExtractChapterInfoResult$1['images'][number];
