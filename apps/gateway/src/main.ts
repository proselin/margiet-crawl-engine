import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayModule } from './gateway.module';
import { AllExceptionsFilter } from '@modules/crawl-engine/exception';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import {
  DEFAULT,
  LoggingInterceptor,
  NODE_ENV,
  TimeoutInterceptor,
  TransformInterceptor,
  Versions,
} from '@shared/common';
import { CsrfMiddleware } from '@shared/middlewares';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(GatewayModule, {
    bufferLogs: true,
  });

  const config = app.get<ConfigService>(ConfigService);

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

  app.use(cookieParser());

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [
            `'self'`,
            'data:',
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [
            `'self'`,
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
        },
      },
    }),
  );
  if (config.getOrThrow('node_env') === NODE_ENV.PRODUCTION) {
    app.use(app.get(CsrfMiddleware).use);
  }
  app.use(compression());

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = +configService.get('server.port');
  const host = configService.get('server.host');
  const prefix = configService.get('server.prefix', DEFAULT.SERVER_PREFIX);

  app.setGlobalPrefix(prefix);

  app.listen(port, host, () => {
    Logger.log(
      '🚀 Application is running on: ' + host + ':' + port,
      'Bootstrap',
    );
  });
}
bootstrap();
