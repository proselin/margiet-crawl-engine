import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { EnvKey } from '@/environment';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService): MongooseModuleFactoryOptions => {
        return {
          appName: 'Margiet',
          uri: configService.get(EnvKey.DATASOURCE_MARGIET_URI),
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
