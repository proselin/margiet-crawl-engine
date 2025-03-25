import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class SupabaseClientProvider {
  private client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {

  }

  getClient(): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('supabase.auth.url');
    const supabaseKey = this.configService.get<string>('supabase.auth.key');
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        debug: true,
        persistSession: true,
      },
      global: {
        fetch: fetch,
      },
    });
    return this.client;
  }
}