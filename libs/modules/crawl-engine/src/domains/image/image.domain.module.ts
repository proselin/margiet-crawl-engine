import { Module } from '@nestjs/common';
import { ImageResolverService } from './services/image-resolver.service';
import { ImageResolver } from './image.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageEntity } from '@shared/database';

@Module({
  imports: [TypeOrmModule.forFeature([ImageEntity])],
  providers: [ImageResolverService, ImageResolver],
})
export class ImageDomainModule {}
