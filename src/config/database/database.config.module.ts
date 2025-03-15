import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NODE_ENV } from '../../common';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDevelopment =
          configService.getOrThrow('node_env') == NODE_ENV.DEVELOPMENT;

        return {
          autoLoadEntities: true,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          logging: false,
          password: configService.getOrThrow('database.password'),
          retryAttempts: 3,
          retryDelay: 3000,
          synchronize: isDevelopment,
          type: 'postgres',
          username: configService.getOrThrow('database.username'),
          host: configService.getOrThrow('database.host'),
          port: configService.getOrThrow('database.port'),
          database: configService.getOrThrow('database.name'),
          autoReconnect: true
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseConfigModule {}
