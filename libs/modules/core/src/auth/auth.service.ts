import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { SupabaseClientProvider } from '../common/supabase';
import { UserResponseModel } from './models';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private configService: ConfigService,
    private supabaseClientProvider: SupabaseClientProvider,
  ) {
    this.supabase = supabaseClientProvider.getClient()
  }

  /**
   * Sign in with GitHub OAuth
   * @param code The authorization code from GitHub OAuth flow
   * @returns Authentication result with user data and tokens
   */
  async signInWithGithub(code: string) {
    try {
      const { data, error }  = await this.supabase.auth.exchangeCodeForSession(code);


      if (error) {
        this.logger.error(error);
        throw new UnauthorizedException(error.message);
      }

      return data;

      //
      // return {
      //   user: this.mapUserData(data.user),
      //   session: data.session,
      // };
    } catch (error) {
      throw new UnauthorizedException('Failed to authenticate with GitHub');
    }
  }

  /**
   * Log out the current user
   * @param token The current access token
   */
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut({
        scope: 'global',
      });

      if (error) {
        throw new UnauthorizedException(error.message);
      }

      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Failed to logout');
    }
  }

  /**
   * Get the current authenticated user
   * @param token The access token
   * @returns Current user data
   */
  async getCurrentUser(token: string) {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      return this.mapUserData(user);
    } catch (error) {
      throw new UnauthorizedException('Failed to get current user');
    }
  }

  /**
   * Helper method to map Supabase user to AuthUser
   */
  private mapUserData(user: any): UserResponseModel {
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url,
      provider: user?.provider,
    };
  }
}