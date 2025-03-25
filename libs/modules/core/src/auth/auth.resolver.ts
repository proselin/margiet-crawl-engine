import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UseGuards } from '@nestjs/common';
import { UserResponseModel } from './models/user-response.model';
import { AuthResponseModel } from './models/auth-response.model';
import { GqlAuthGuard } from '@shared/common/guards';
import { CurrentUser } from '@shared/common';
import { StatusOnlyMutationResponseModel } from '@modules/crawl-engine/common/types/status-only-mutation-response.model';
import { ResponseUtils } from '@shared/common/utils/response';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponseModel)
  async signInWithGithub(@Args('code') code: string) {
    return this.authService.signInWithGithub(code);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => StatusOnlyMutationResponseModel)
  async logout() {
    try {
      await this.authService.logout();
      return ResponseUtils.successWithStatusOnly();
    } catch {
      return ResponseUtils.failedWithStatusOnly();
    }
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserResponseModel)
  me(@CurrentUser() user: any) {
    return user;
  }
}
