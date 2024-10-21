import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { createApp, SwaggerConfig } from './config';
import { EnvKey } from '@/config/environment';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await createApp(AppModule);
  const configService = app.get(ConfigService);
  const port = +configService.get(EnvKey.SERVER_PORT);
  const host = configService.get(EnvKey.SERVER_HOST, '0.0.0.0');
  const prefix = configService.get(EnvKey.SERVER_PREFIX, 'api');
  const swaggerPrefix = configService.get(
    'SERVER_API_DOCUMENT_PREFIX',
    'swagger',
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
