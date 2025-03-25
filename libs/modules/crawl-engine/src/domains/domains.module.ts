import { Module } from '@nestjs/common';
import { HealthModule } from './health';
import { ChapterDomainModule } from './chapter';
import { ImageDomainModule } from './image';
import { ComicDomainModule } from './comic';

@Module({
  imports: [
    HealthModule,
    ChapterDomainModule,
    ComicDomainModule,
    ImageDomainModule,
  ],
})
export class DomainsModule {}
