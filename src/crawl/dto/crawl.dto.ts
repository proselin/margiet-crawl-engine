import { IsNotEmpty, IsString } from 'class-validator';

export class CrawlDto {
  @IsString()
  @IsNotEmpty()
  href: string;
}
