import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';

import { CrawlUploadService } from './crawl-upload.service';
import {
  IExtractImageResult$1,
  IUploadImageResultModel$1,
} from '../../../../models';
import { ChapterEntity, ImageEntity, MinioUploadHistory } from '@libs/database';
import { ImageType } from '@libs/common/constant/image';

@Injectable()
export class CrawlImageService implements BeforeApplicationShutdown {
  private logger = new Logger(CrawlImageService.name);

  constructor(private crawlUploadService: CrawlUploadService) {}

  async crawlAndUploadChapterImage(
    chapter: ChapterEntity,
    rawImages: IExtractImageResult$1[],
    domain: string,
  ) {
    try {
      this.logger.log(`Start crawl and upload chapter image`);
      const uploadedImages = await this.crawlUploadService.crawlNUploadImages(
        `c-${chapter.id}`,
        rawImages,
        domain,
      );
      const images = await Promise.all(
        uploadedImages.map(async (uploadedImage: IUploadImageResultModel$1) => {
          return this.createImageDocument(
            uploadedImage,
            ImageType.CHAPTER_IMAGE,
          );
        }),
      );
      this.logger.log(`Found ${images.length} chapter images`);
      const existedImages = (await chapter?.images) ?? [];
      existedImages.push(...images);
      chapter.images = Promise.resolve(existedImages);

      this.logger.log(`Create ${uploadedImages.length} uploaded images`);
      this.logger.log(`Update chapter id ${chapter.id}`);
      return existedImages;
    } catch (e) {
      this.logger.error(e);
      throw new Error('Insert data image failed !!', e);
    }
  }

  async handleCrawlThumbUrl(
    imageUrls: string[],
    domain: string,
  ): Promise<ImageEntity> {
    const imageUploadedInfo =
      await this.crawlUploadService.crawlAndUploadImageToStore(
        `cm-${Date.now()}`,
        imageUrls,
        domain,
      );
    return this.createImageDocument(
      {
        ...imageUploadedInfo,
        position: 0,
        originUrls: imageUrls,
      },
      ImageType.THUMB,
    );
  }

  async beforeApplicationShutdown() {}

  private async createImageDocument(
    uploadedImage: IUploadImageResultModel$1,
    type: ImageType,
  ) {
    try {
      this.logger.log(
        `[${this.createImageDocument.name}]: START create image with file name ${uploadedImage.fileName}`,
      );
      const image = new ImageEntity();
      image.url = uploadedImage?.fileUrl ?? '';
      image.originUrls = uploadedImage.originUrls;
      image.position = uploadedImage.position;
      image.type = type;

      const uploadMinioHistory = new MinioUploadHistory();
      uploadMinioHistory.url = uploadedImage?.fileUrl;
      uploadMinioHistory.fileName = uploadedImage?.fileName;
      uploadMinioHistory.bucketName = uploadedImage?.bucketName ?? '';
      await uploadMinioHistory.save();

      image.minioUploadHistory = Promise.resolve(uploadMinioHistory);
      await image.save();

      this.logger.log(
        `[${this.createImageDocument.name}]: DONE create image with file name ${uploadedImage.fileName}`,
      );
      return image;
    } catch (e) {
      this.logger.error(
        `[${this.createImageDocument.name}]: Failed to create image with uploaded url `,
      );
      this.logger.error(e);
      throw e;
    }
  }
}
