import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { createApp, SwaggerConfig } from './config';

import { Logger } from '@nestjs/common';
import { DEFAULT } from '@/common';
import { EnvName } from '@/common/constant/env';

async function bootstrap() {
  const app = await createApp(AppModule);
  const configService = app.get(ConfigService);
  const port = +configService.get(EnvName.SERVER_PORT, DEFAULT.SERVER_PORT);
  const host = configService.get(EnvName.SERVER_HOST, DEFAULT.SERVER_HOST);
  const prefix = configService.get(
    EnvName.SERVER_PREFIX,
    DEFAULT.SERVER_PREFIX,
  );
  const swaggerPrefix = configService.get(
    EnvName.SERVER_API_DOCUMENT_PREFIX,
    DEFAULT.SERVER_API_DOCUMENT_PREFIX,
  );
  app.setGlobalPrefix(prefix);
  SwaggerConfig.setupOpenApi(app, {});
  app.listen(port, host, (err, address) => {
    if (err) {
      console.error(err);
      console.error(JSON.stringify(err));
    } else {
      Logger.log('🚀 Application is running on: ' + address);
      Logger.log(' Swagger is running on: ' + address + '/' + swaggerPrefix);
    }
  });
}

bootstrap()
  .then()
  .catch((err) => {
    console.error(err);
  });
