import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from '@/config/database/database.config';

@Module({
  imports: [TypeOrmModule.forRootAsync(databaseConfig.asProvider())],
  exports: [TypeOrmModule],
})
export class DatabaseModule implements OnModuleInit {
  onModuleInit() {}
}
