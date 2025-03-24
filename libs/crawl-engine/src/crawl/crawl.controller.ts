import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { CrawlService } from './crawl.service';
import { APIResponse } from '../utils/response';
import { Versions } from '@libs/common';
import { AddCrawlComicByUrlDTO } from '@modules/crawl-engine/crawl/dto';

@ApiTags('crawl')
@Controller({
  path: 'crawl',
  version: Versions.V1,
})
export class CrawlController {
  constructor(private service: CrawlService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'A task crawling url has been created',
  })
  public async addCrawlComicByUrl(@Body() body: AddCrawlComicByUrlDTO) {
    return await this.service.addCrawlComicJob(<string>body.target);
  }

  @Get('/request')
  public async request(@Req() request: Request) {
    if (!request.query?.target) {
      throw new BadRequestException();
    }
    const { comicId, newUrl } = request.query;
    return APIResponse.successWithNoResponse(
      await this.service.updateCrawlComicJob(
        +comicId,
        (newUrl as string) || null,
      ),
    );
  }

  // @Get('/update')
  // @ApiProperty({
  //   description: 'Crawl new Comic',
  // })
  // @ApiQuery({
  //   name: 'comicId',
  //   description: 'Id of comic',
  // })
  // @ApiQuery({
  //   name: 'newUrl',
  //   description: 'new url for comic-fe',
  // })
  // public async update(@Req() request: Request) {
  //   if (!request.query?.target) {
  //     throw new BadRequestException();
  //   }
  //   const { comicId, newUrl } = request.query;
  //   return APIResponse.successWithNoResponse(
  //     await this.service.updateCrawlComicJob(
  //       +comicId,
  //       (newUrl as string) || null,
  //     ),
  //   );
  // }
}
