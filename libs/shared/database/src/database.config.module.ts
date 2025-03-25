import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const username = configService.getOrThrow('database.username');
        const host = configService.getOrThrow('database.host');
        const port = configService.getOrThrow('database.port');
        const database = configService.getOrThrow('database.name');
        const password = configService.getOrThrow('database.password');

        const connectionString = `postgres://${username}:${password}@${host}:${port}/${database}`;

        return {
          autoLoadEntities: true,
          entities: [__dirname + '/**/*.{entities,entity}{.ts,.js}'],
          logging: true,
          synchronize: true,
          type: 'postgres',
          autoReconnect: true,
          url: connectionString,
          // cache: {
          //   duration: DEFAULT_CACHE_CONFIG.ONE_DAY,
          //   type: 'redis',
          //   options: {
          //     socket: {
          //       host: configService.getOrThrow('redis.host'),
          //       port: configService.getOrThrow('redis.port'),
          //     },
          //   },
          // },
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseConfigModule {}
