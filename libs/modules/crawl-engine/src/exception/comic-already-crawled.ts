import { HttpException, HttpStatus } from '@nestjs/common';

export class ComicAlreadyCrawledException extends HttpException {
  constructor() {
    super(
      {
        message: 'Comic already crawled!',
        code: 'CE-001',
        httpCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}
