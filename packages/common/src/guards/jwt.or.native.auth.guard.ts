import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { CachingService } from '../common/caching/caching.service';
import { ErdnestConfigService } from '../common/config/erdnest.config.service';
import { ERDNEST_CONFIG_SERVICE } from '../utils/erdnest.constants';
import { JwtAuthenticateGuard } from './jwt.authenticate.guard';
import { NativeAuthGuard } from './native.auth.guard';

@Injectable()
export class JwtOrNativeAuthGuard implements CanActivate {
  constructor(
    @Inject(ERDNEST_CONFIG_SERVICE)
    private readonly erdnestConfigService: ErdnestConfigService,
    private readonly cachingService: CachingService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtGuard = new JwtAuthenticateGuard(this.erdnestConfigService);
    const nativeAuthGuard = new NativeAuthGuard(this.cachingService);

    const guards = [jwtGuard, nativeAuthGuard];

    const canActivateResponses = await Promise.all(
      guards.map((guard) => {
        try {
          return guard.canActivate(context);
        } catch {
          return false;
        }
      })
    );

    const canActivate = canActivateResponses.reduce(
      (result, value) => result || value,
      false
    );
    return canActivate;
  }
}
