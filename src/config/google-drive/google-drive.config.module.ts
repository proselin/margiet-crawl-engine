import { Module } from "@nestjs/common";
import { GoogleDriveConfig, GoogleDriveModule } from "@libs/google-drive";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    GoogleDriveModule.registerSync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): GoogleDriveConfig | Promise<GoogleDriveConfig> => {
        return {
          clientId: configService.getOrThrow("google-drive.client-id"),
          clientSecret: configService.getOrThrow("google-drive.client-secret"),
          redirectUrl: configService.getOrThrow("google-drive.redirect-url"),
          refreshToken: configService.getOrThrow("google-drive.refresh-token"),
        };
      },
    }),
  ],
})
export class GoogleDriveConfigModule {}
