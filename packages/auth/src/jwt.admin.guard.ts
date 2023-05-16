import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { ExecutionContextUtils, ErdnestConfigService, ERDNEST_CONFIG_SERVICE } from '@multiversx/sdk-nestjs-common';

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


    const admins = this.erdnestConfigService.getSecurityAdmins();
    if (!admins) {
      return false;
    }

    const request = ExecutionContextUtils.getRequest(context);

    return admins.includes(request.jwt.address);
  }
}
