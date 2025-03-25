import { Module } from '@nestjs/common';
import { HttpModule as NestHttpModule } from '@nestjs/axios';

@Module({
  imports: [
    NestHttpModule.register({
      global: true,
    }),
  ],
})
export class HttpConfigModule {}
