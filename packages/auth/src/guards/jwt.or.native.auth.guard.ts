import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { JwtAuthenticateGuard } from './jwt.authenticate.guard';
import { JwtConfig, NativeAuthConfig } from '../models';
import { NativeAuthGuard } from './native.auth.guard';

@Injectable()
export class JwtOrNativeAuthGuard implements CanActivate {
  constructor(
    private readonly jwtConfig: JwtConfig,
    private readonly nativeAuthConfig: NativeAuthConfig
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtGuard = new JwtAuthenticateGuard(this.jwtConfig);
    const nativeAuthGuard = new NativeAuthGuard(this.nativeAuthConfig);

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
