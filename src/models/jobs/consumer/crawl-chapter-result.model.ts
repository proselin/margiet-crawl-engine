import { ChapterEntity } from "../../../entities/chapter";
import { ImageEntity } from "../../../entities/image";

export class CrawlChapterResultModel {
  chapter: ChapterEntity;
  images: ImageEntity[];
}
