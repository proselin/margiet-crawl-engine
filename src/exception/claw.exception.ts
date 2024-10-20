import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { HttpStatus } from '@nestjs/common';

export class InvalidComicInformation extends HttpException {
  constructor() {
    super(
      {
        name: 'Invalid Comic Information',
        code: 'CL_001',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
