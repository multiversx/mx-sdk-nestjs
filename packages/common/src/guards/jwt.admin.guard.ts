import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { ErdnestConfigService } from 'src/common/config/erdnest.config.service';
import { ERDNEST_CONFIG_SERVICE } from 'src/utils/erdnest.constants';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    @Inject(ERDNEST_CONFIG_SERVICE)
    private readonly erdnestConfigService: ErdnestConfigService
  ) { }

  // eslint-disable-next-line require-await
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const jwt = request.jwt;

    const admins = this.erdnestConfigService.getSecurityAdmins();
    if (!admins) {
      return false;
    }

    return admins.includes(jwt.address);
  }
}
