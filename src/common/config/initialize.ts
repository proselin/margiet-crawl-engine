import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Versions } from '@/common';
import {
  LoggingInterceptor,
  TimeoutInterceptor,
  TransformInterceptor,
} from '@/common';

export async function createApp(appModule: any) {
  const app = await NestFactory.create<NestFastifyApplication>(
    appModule,
    new FastifyAdapter({ logger: true }),
    {
      bufferLogs: true,
    },
  );

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

  return app;
}
