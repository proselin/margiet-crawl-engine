import { IsNotEmpty, IsString, validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Logger } from '@nestjs/common';

export enum EnvKey {
  NODE_ENV = 'NODE_ENV',

  REDIS_HOST = 'REDIS_HOST',
  REDIS_PORT = 'REDIS_PORT',
  REDIS_USERNAME = 'REDIS_USERNAME',
  REDIS_PASSWORD = 'REDIS_PASSWORD',

  DB_URI = 'DB_URI',

  SERVER_HOST = 'SERVER_HOST',
  SERVER_PORT = 'SERVER_PORT',
  SERVER_PREFIX = 'SERVER_PREFIX',

  MINIO_ENDPOINT = 'MINIO_ENDPOINT',
  MINIO_PORT = 'MINIO_PORT',
  MINIO_USE_SSL = 'MINIO_USE_SSL',
  MINIO_ACCESS_KEY = 'MINIO_ACCESS_KEY',
  MINIO_SECRET_KEY = 'MINIO_SECRET_KEY',
  MINIO_BUCKET = 'MINIO_BUCKET',
}

export type IEnvironment = Record<EnvKey, string>;

class Environment implements Partial<IEnvironment> {
  @IsString()
  @IsNotEmpty()
  [EnvKey.NODE_ENV]: string;

  @IsString()
  @IsNotEmpty()
  [EnvKey.SERVER_PORT]: string;

  @IsString()
  @IsNotEmpty()
  [EnvKey.REDIS_HOST]: string;

  @IsString()
  @IsNotEmpty()
  [EnvKey.REDIS_PORT]: string;

  @IsString()
  [EnvKey.REDIS_USERNAME]: string;

  @IsString()
  [EnvKey.REDIS_PASSWORD]: string;

  @IsString()
  @IsNotEmpty()
  [EnvKey.DB_URI]: string;
}

export function envValidation() {
  const validatedConfig = plainToClass(Environment, process.env, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    Logger.error(errors.toString(), Environment.name);
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
