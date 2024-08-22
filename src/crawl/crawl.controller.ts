import { BadRequestException, Controller, Get, Req } from '@nestjs/common';
import { ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CrawlService } from './crawl.service';
import { Versions } from '@crawl-engine/common';

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
}
