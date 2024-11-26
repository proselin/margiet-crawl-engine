import { registerAs } from '@nestjs/config';
import { EnvName } from '@/common/constant/env';
import { NODE_ENV } from '@/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', () => {
  return {
    type: 'postgres',
    url: process.env[EnvName.DATASOURCE_URI],
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: process.env[EnvName.NODE_ENV] === NODE_ENV.DEVELOPMENT,
    logging: false,
    autoLoadEntities: true,
    retryDelay: 3000,
    retryAttempts: 3,
  } satisfies TypeOrmModuleOptions;
});
