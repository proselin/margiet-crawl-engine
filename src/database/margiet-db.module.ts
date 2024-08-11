import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { EnvKey } from '@crawl-engine/environment';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService): MongooseModuleFactoryOptions => {
        return {
          appName: 'Margiet',
          uri:
            'mongodb://' +
            `${configService.get(EnvKey.DATASOURCE_MARGIET_HOST, 'localhost')}:` +
            `${configService.get(EnvKey.DATASOURCE_MARGIET_PORT, 27017)}`,
          user: configService.get(EnvKey.DATASOURCE_MARGIET_USERNAME, 'root'),
          pass: configService.get(EnvKey.DATASOURCE_MARGIET_PWD, 'example'),
          dbName: configService.get(
            EnvKey.DATASOURCE_MARGIET_DBNAME,
            'nestjs_db',
          ),
          retryDelay: 3000,
          retryAttempts: 3,
          ssl: false,
          autoCreate: true,
          autoIndex: true,
        };
      },
    }),
  ],
})
export class MargietDbModule {}
