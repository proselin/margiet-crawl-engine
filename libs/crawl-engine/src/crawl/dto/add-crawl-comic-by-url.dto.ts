import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCrawlComicByUrlDTO {
  @ApiProperty({
    description: 'Target URL maybe nettruyen URL',
  })
  @IsNotEmpty()
  @IsString()
  target: string;
}
