import { Injectable, CanActivate, ExecutionContext, Inject, Optional } from '@nestjs/common';
import { CachingService } from '../common/caching/caching.service';
import { ErdnestConfigService } from '../common/config/erdnest.config.service';
import { ERDNEST_CONFIG_SERVICE } from '../utils/erdnest.constants';
import { JwtAuthenticateGuard } from './jwt.authenticate.guard';
import { NativeAuthGuard } from './native.auth.guard';
import { ElrondCachingService } from '../common';

@Injectable()
export class JwtOrNativeAuthGuard implements CanActivate {
  constructor(
    @Inject(ERDNEST_CONFIG_SERVICE) private readonly erdnestConfigService: ErdnestConfigService,
    @Optional() private readonly cachingService?: CachingService,
    @Optional() private readonly elrondCachingService?: ElrondCachingService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtGuard = new JwtAuthenticateGuard(this.erdnestConfigService);
    const nativeAuthGuard = new NativeAuthGuard(this.erdnestConfigService, this.cachingService, this.elrondCachingService);

    try {
      const result = await jwtGuard.canActivate(context);
      if (result) {
        return true;
      }
    } catch (error) {
      // do nothing
    }

    try {
      return await nativeAuthGuard.canActivate(context);
    } catch (error) {
      return false;
    }
  }
}
