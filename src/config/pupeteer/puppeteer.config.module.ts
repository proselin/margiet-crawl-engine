import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nestjs-puppeteer';
import { ConfigService } from '@nestjs/config';
import { NODE_ENV } from '@/common';
import { EnvName } from '@/common/constant/env';

@Module({
  imports: [
    PuppeteerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDevMode =
          configService.get<NODE_ENV>(EnvName.NODE_ENV) == NODE_ENV.DEVELOPMENT;
        return {
          headless: 'new',
          waitForInitialPage: true,
          defaultViewport: null,
          executablePath: '/usr/bin/google-chrome',
          devtools: isDevMode,
          args: ['--no-sandbox'],
        };
      },
    }),
  ],
  exports: [PuppeteerModule],
})
export class PuppeteerConfigModule {}
