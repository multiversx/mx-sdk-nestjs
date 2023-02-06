import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtConfig } from '../models';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    private readonly jwtConfig: JwtConfig
  ) { }

  // eslint-disable-next-line require-await
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const jwt = request.jwt;

    const admins = this.jwtConfig.admins;
    if (!admins) {
      return false;
    }

    return admins.includes(jwt.address);
  }
}
