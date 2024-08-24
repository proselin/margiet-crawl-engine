import { IsNotEmpty, IsString } from 'class-validator';
import { EnvKey } from './env-key';

export type IEnvironment = Record<EnvKey, string>;

export class Environment implements Partial<IEnvironment> {
  @IsString()
  @IsNotEmpty()
  [EnvKey.NODE_ENV]: string;

  @IsString()
  @IsNotEmpty()
  [EnvKey.SERVER_HOST]: string;

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
  @IsNotEmpty()
  [EnvKey.REDIS_USERNAME]: string;

  @IsString()
  @IsNotEmpty()
  [EnvKey.REDIS_PASSWORD]: string;

  @IsString()
  @IsNotEmpty()
  [EnvKey.DATASOURCE_MARGIET_URI]: string;
}
