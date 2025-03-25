import { Module } from '@nestjs/common';
import { SupabaseStrategy } from './strategies';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PassportModule } from '@nestjs/passport';
import { SupabaseClientProvider } from '../common/supabase';

@Module({
  imports: [PassportModule],
  providers: [
    SupabaseClientProvider,
    AuthService,
    AuthResolver,
    SupabaseStrategy,
  ],
  exports: [AuthService, SupabaseStrategy],
})
export class AuthModule {}
