import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { createApp, SwaggerConfig } from './common';
import { EnvKey } from './environment';

async function bootstrap() {
  const app = await createApp(AppModule);
  const configService = app.get(ConfigService);
  const port = +configService.get(EnvKey.SERVER_PORT);
  const host = configService.get(EnvKey.SERVER_HOST);
  const prefix = configService.get(EnvKey.SERVER_PREFIX, 'api');
  app.setGlobalPrefix(prefix);
  SwaggerConfig.setupOpenApi(app, {});
  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://${host}:${port}/${prefix}`);
}

bootstrap()
  .then()
  .catch((err) => {
    console.error(err);
  });
