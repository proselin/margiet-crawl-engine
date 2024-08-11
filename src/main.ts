import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { RedisConfig } from '@crawl-engine/common/config/redis.config';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    RedisConfig.connectRedisMicroservice(process.env),
  );
  await app.listen();
  Logger.log(`🚀 Microservice is running`, 'Bootstrap');
}

bootstrap();
