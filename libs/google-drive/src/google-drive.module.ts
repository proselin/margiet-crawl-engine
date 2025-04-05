import { DynamicModule, Module } from '@nestjs/common';
import { GOOGLE_DRIVE_CONFIG } from './google-drive.constant';
import { GoogleDriveService } from './google-drive.service';
import { GoogleDriveConfig } from './types';

@Module({})
export class GoogleDriveModule {
  static register(googleDriveConfig: GoogleDriveConfig): DynamicModule {
    return {
      module: GoogleDriveModule,
      global: true,
      providers: [
        {
          provide: GOOGLE_DRIVE_CONFIG,
          useValue: googleDriveConfig,
        },
        GoogleDriveService,
      ],
      exports: [
        GoogleDriveService,
        {
          provide: GOOGLE_DRIVE_CONFIG,
          useValue: googleDriveConfig,
        },
      ],
    };
  }
  static registerSync(configuration: {
    useFactory: (
      ...arg: any[]
    ) => Promise<GoogleDriveConfig> | GoogleDriveConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: GoogleDriveModule,
      global: true,
      providers: [
        {
          provide: GOOGLE_DRIVE_CONFIG,
          useFactory: configuration.useFactory,
          inject: configuration.inject ?? [],
        },
        GoogleDriveService,
      ],
      exports: [
        GoogleDriveService,
        {
          provide: GOOGLE_DRIVE_CONFIG,
          useFactory: configuration.useFactory,
          inject: configuration.inject ?? [],
        },
      ],
    };
  }
}
