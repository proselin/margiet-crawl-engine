import { Module } from '@nestjs/common';
import { AuthorService } from './author.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorSchema } from '@crawl-engine/author/author.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Author', schema: AuthorSchema }]),
  ],
  providers: [AuthorService],
  exports: [AuthorService],
})
export class AuthorModule {}
