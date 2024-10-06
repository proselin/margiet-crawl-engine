import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Author, AuthorSchema } from '@/models/author/author.schema';
import { AuthorService } from '@/models/author/author.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Author.name, schema: AuthorSchema }]),
  ],
  providers: [AuthorService],
  exports: [AuthorService],
})
export class AuthorModule {}
