import { CrawlUploadService } from '@/queues/consumers/craw-consumer/services/crawl-upload.service';
import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';
import { ImageEntity } from '@/entities/image';
import { MinioUploadHistory } from '@/entities/minio-upload-history';
import { CrawlUploadResponse, RawImage } from '@/common';
import { ChapterEntity } from '@/entities/chapter';
import { QueryRunner } from 'typeorm';

@Injectable()
export class CrawlImageService implements BeforeApplicationShutdown {
  private logger = new Logger(CrawlImageService.name);

  constructor(private crawlUploadService: CrawlUploadService) {}

  async handleCrawlThumbUrl(imageUrls: string[]): Promise<ImageEntity> {
    const imageUploadedInfo =
      await this.crawlUploadService.crawlAndUploadImageToStore(
        `cm-${Date.now()}`,
        imageUrls,
      );
    return this.createImageDocument({
      ...imageUploadedInfo,
      position: 0,
      originUrls: imageUrls,
    });
  }

  async crawlAndUploadChapterImage(
    chapter: ChapterEntity,
    rawImages: RawImage[],
    queryRunner?: QueryRunner,
  ) {
    try {
      this.logger.log(`Start crawl and upload chapter image`);
      const uploadedImages = await this.crawlUploadService.crawlAndUploadMulti(
        `c-${chapter.id}`,
        rawImages,
      );
      const images = await Promise.all(
        uploadedImages.map(
          async (uploadedImage: CrawlUploadResponse[number]) => {
            return this.createImageDocument(uploadedImage, queryRunner);
          },
        ),
      );
      this.logger.log(`Found ${images.length} chapter images`);
      const existedImages = (await chapter?.images) ?? [];
      existedImages.push(...images);
      chapter.images = Promise.resolve(existedImages);
      // await chapter.save();

      this.logger.log(`Create ${uploadedImages.length} uploaded images`);
      this.logger.log(`Update chapter id ${chapter.id}`);
      return existedImages;
    } catch (e) {
      this.logger.error(e);
      throw new Error('Insert data image failed !!', e);
    }
  }

  async beforeApplicationShutdown() {}

  private async createImageDocument(
    uploadedImage: CrawlUploadResponse[number],
    queryRunner?: QueryRunner,
  ) {
    try {
      this.logger.log(
        `[${this.createImageDocument.name}]: START create image with file name ${uploadedImage.fileName}`,
      );
      const image = new ImageEntity();
      image.url = uploadedImage?.fileUrl ?? '';
      image.originUrls = uploadedImage.originUrls;
      image.position = uploadedImage.position;

      const uploadMinioHistory = new MinioUploadHistory();
      uploadMinioHistory.url = uploadedImage?.fileUrl;
      uploadMinioHistory.fileName = uploadedImage?.fileName;
      uploadMinioHistory.bucketName = uploadedImage?.bucketName ?? '';
      await (queryRunner
        ? queryRunner.manager.save(uploadMinioHistory)
        : uploadMinioHistory.save());

      image.minioUploadHistory = Promise.resolve(uploadMinioHistory);
      await (queryRunner ? queryRunner.manager.save(image) : image.save());

      this.logger.log(
        `[${this.createImageDocument.name}]: DONE create image with file name ${uploadedImage.fileName}`,
      );
      return image;
    } catch (e) {
      this.logger.error(
        `[${this.createImageDocument.name}]: Failed to create image with uploaded url `,
        uploadedImage,
      );
      throw e;
    }
  }
}
