import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorSchema } from '@/entities/author/author.schema';
import { AuthorService } from '@/entities/author/author.service';
import { EntityConfig } from '@/base/entity/entity-config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntityConfig.ModelName.Author, schema: AuthorSchema },
    ]),
  ],
  providers: [AuthorService],
  exports: [AuthorService],
})
export class AuthorModule {}
