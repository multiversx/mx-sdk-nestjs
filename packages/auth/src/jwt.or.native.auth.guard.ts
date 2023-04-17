import { Injectable, CanActivate, ExecutionContext, Inject, Optional } from '@nestjs/common';
import { ElrondCachingService } from '@multiversx/sdk-nestjs-cache';
import { ErdnestConfigService, ERDNEST_CONFIG_SERVICE } from '@multiversx/sdk-nestjs-common';
import { JwtAuthenticateGuard } from './jwt.authenticate.guard';
import { NativeAuthGuard } from './native.auth.guard';

@Injectable()
export class JwtOrNativeAuthGuard implements CanActivate {
  constructor(
    @Inject(ERDNEST_CONFIG_SERVICE) private readonly erdnestConfigService: ErdnestConfigService,
    @Optional() private readonly elrondCachingService?: ElrondCachingService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtGuard = new JwtAuthenticateGuard(this.erdnestConfigService);
    const nativeAuthGuard = new NativeAuthGuard(this.erdnestConfigService, this.elrondCachingService);

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
