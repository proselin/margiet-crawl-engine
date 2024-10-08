import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { EnvKey } from '@/environment';
import { Global, Module, OnModuleInit } from '@nestjs/common';
import mongoose from 'mongoose';
import autopopulate from 'mongoose-autopopulate';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService): MongooseModuleFactoryOptions => {
        return {
          appName: 'MargietCrawlEngine',
          uri: configService.get(EnvKey.DATASOURCE_MARGIET_URI),
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
export class CrawlEngineDbModule implements OnModuleInit {
  onModuleInit() {
    mongoose.plugin(autopopulate);
    mongoose.plugin((schema) => {
      schema.set('id', true);
      schema.set('timestamps', true);
    });
  }
}
