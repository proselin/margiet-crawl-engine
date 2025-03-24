import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import {
  DEFAULT,
  LoggingInterceptor,
  TimeoutInterceptor,
  TransformInterceptor,
  Versions,
} from '@libs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayModule } from './gateway.module';
import { AllExceptionsFilter } from '@modules/crawl-engine/exception';
import { SwaggerConfig } from '@libs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(GatewayModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));

  app.useGlobalInterceptors(new TimeoutInterceptor());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: Versions.V1,
  });

  app.enableShutdownHooks();

  app.useGlobalFilters(new AllExceptionsFilter());

  const configService = app.get(ConfigService);
  const port = +configService.get('server.port', DEFAULT.SERVER_PORT);
  const host = configService.get('server.host', DEFAULT.SERVER_HOST);
  const prefix = configService.get('server.prefix', DEFAULT.SERVER_PREFIX);
  const swaggerPrefix = configService.get(
    'server.doc-prefix',
    DEFAULT.SERVER_API_DOCUMENT_PREFIX,
  );

  app.setGlobalPrefix(prefix);
  SwaggerConfig.setupOpenApi(app);

  app.listen(port, host, () => {
    Logger.log('🚀 Application is running on: ' + host + ':' + port);
    Logger.log(
      ' Swagger is running on: ' + host + ':' + port + '/' + swaggerPrefix,
    );
  });
}
bootstrap();
