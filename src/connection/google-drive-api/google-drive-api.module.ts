import { EnvKey } from '@/config/environment';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleDriveModule,
  GoogleDriveService,
} from '@margiet-libs/google-drive';

@Module({
  imports: [
    GoogleDriveModule.registerSync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          clientId: configService.get(EnvKey.G_CLIENT_ID),
          clientSecret: configService.get(EnvKey.G_CLIENT_SECRET),
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
