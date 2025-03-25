import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { SupabaseAuthStrategy, SupabaseAuthStrategyOptions } from 'nestjs-supabase-auth';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(
  SupabaseAuthStrategy,
  'supabase',
) {
  private logger = new Logger(SupabaseStrategy.name);

  public constructor(private readonly configService: ConfigService) {
    super({
      supabaseUrl: configService.get('supabase.auth.url'),
      supabaseKey: configService.get('supabase.auth.key'),
      supabaseOptions: {},
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
    } satisfies SupabaseAuthStrategyOptions);
  }

  async validate(payload: any): Promise<any> {
    this.logger.log(`Validate: ${JSON.stringify(payload)};`)
    return super.validate(payload);
  }

  authenticate(req) {
    super.authenticate(req);
  }
}
