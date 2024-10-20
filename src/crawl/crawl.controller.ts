import { BadRequestException, Controller, Get, Req } from '@nestjs/common';
import { ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CrawlService } from './crawl.service';
import { Versions } from '@/constant';

@ApiTags('crawl')
@Controller({
  path: 'crawl',
  version: Versions.V1,
})
export class CrawlController {
  constructor(private service: CrawlService) {}

  @Get()
  @ApiProperty({
    description: 'Get the crawl',
  })
  @ApiQuery({
    name: 'target',
    description: 'href of the target',
  })
  public async target(@Req() request: Request) {
    if (!request.query?.target) {
      throw new BadRequestException();
    }
    return await this.service.addCrawlComicJob(<string>request.query.target);
  }

  @Get('/request')
  public async request(@Req() request: Request) {
    if (!request.query?.target) {
      throw new BadRequestException();
    }
    const { comicId, newUrl } = request.query;
    return await this.service.updateCrawlComicJob(
      comicId as string,
      (newUrl as string) || null,
    );
  }

  @Get('/update')
  @ApiProperty({
    description: 'recrawl comic-fe',
  })
  @ApiQuery({
    name: 'comicId',
    description: 'id of comic-fe ',
  })
  @ApiQuery({
    name: 'newUrl',
    description: 'new url for comic-fe',
  })
  public async update(@Req() request: Request) {
    if (!request.query?.target) {
      throw new BadRequestException();
    }
    const { comicId, newUrl } = request.query;
    return await this.service.updateCrawlComicJob(
      comicId as string,
      (newUrl as string) || null,
    );
  }
}
