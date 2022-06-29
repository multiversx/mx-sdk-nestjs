import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { NESTJS_API_CONFIG_SERVICE } from '../utils/nestjs.microservice.constants';
import { NestjsApiConfigService } from '../common/api-config/nestjs.api.config.service';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    @Inject(NESTJS_API_CONFIG_SERVICE)
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
