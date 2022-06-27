import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { NestjsApiConfigService } from '../../common/api-config/nestjs.api.config.service';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    private readonly apiConfigService: NestjsApiConfigService
  ) { }

  // eslint-disable-next-line require-await
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const jwt = request.jwt;

    const admins = this.apiConfigService.getSecurityAdmins();
    if (!admins) {
      return false;
    }

    return admins.includes(jwt.address);
  }
}
