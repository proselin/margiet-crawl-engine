import { EnvKey } from '@crawl-engine/environment';
import {
  GoogleDriveModule,
  GoogleDriveService,
} from '@crawl-engine/libs/google-drive';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    GoogleDriveModule.registerSync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          clientId: configService.get(EnvKey.G_CLIENT_ID),
          clientSecret: configService.get(EnvKey.G_CLIENT_SECREC),
          redirectUrl: configService.get(EnvKey.G_REDIRECT_URI),
          refreshToken: configService.get(EnvKey.G_REFRESH_TOKEN),
        };
      },
    }),
  ],
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class GoogleDriveApiModule {}
