import { BadRequestException, Controller, Get, Req } from '@nestjs/common';
import { ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CrawlService } from './crawl.service';
import { Versions } from '@/common';

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

  @Get('/update')
  @ApiProperty({
    description: 'recrawl comic',
  })
  @ApiQuery({
    name: 'comicId',
    description: 'id of comic ',
  })
  @ApiQuery({
    name: 'newUrl',
    description: 'new url for comic',
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


  @Get('/sync')
  @ApiProperty({
    description: 'recrawl comic',
  })
  @ApiQuery({
    name: 'comicId',
    description: 'id of comic ',
  })
  public async sync(@Req() request: Request) {
    const { chapterId } = request.query;
    return await this.service.addSyncChapterJob(
      chapterId as string
    );
  }

}
