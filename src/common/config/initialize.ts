import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import {
  LoggingInterceptor,
  TimeoutInterceptor,
  TransformInterceptor,
} from '../intercept';
import { Versions } from '../constant';

export async function createApp(appModule: any) {
  const app = await NestFactory.create(appModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));

  app.useGlobalInterceptors(new TimeoutInterceptor());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: Versions.V1,
  });

  app.use(cookieParser());

  app.enableShutdownHooks();

  return app;
}
