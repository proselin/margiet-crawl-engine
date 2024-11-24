import { registerAs } from '@nestjs/config';
import { EnvName } from '@/common/constant/env';
import { NODE_ENV } from '@/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', () => {
  return {
    type: 'better-sqlite3',
    database: process.env[EnvName.DATASOURCE_URI],
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: process.env[EnvName.NODE_ENV] === NODE_ENV.DEVELOPMENT,
    logging: process.env[EnvName.NODE_ENV] === NODE_ENV.DEVELOPMENT,
    autoLoadEntities: true,
    retryDelay: 3000,
    retryAttempts: 3,
  } satisfies TypeOrmModuleOptions;
});
