import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UploadImageToDriveJobModel {
  @IsString()
  @IsNotEmpty()
  bucket: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  chapterId: string;

  @IsString()
  comicId: string;

  @IsString()
  @IsNotEmpty()
  imageId: string;

  @IsNumber()
  @IsNotEmpty()
  position: number;
}
