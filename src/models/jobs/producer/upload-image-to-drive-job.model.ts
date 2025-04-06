import { IsNotEmpty, IsNumber, IsString } from "class-validator";

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

  @IsNumber()
  chapterId: number;

  @IsNumber()
  comicId: number;

  @IsNumber()
  @IsNotEmpty()
  imageId: number;

  @IsNumber()
  @IsNotEmpty()
  position: number;
}
