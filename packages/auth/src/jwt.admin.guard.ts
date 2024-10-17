import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { ExecutionContextUtils, MxnestConfigService, MXNEST_CONFIG_SERVICE } from '@multiversx/sdk-nestjs-common';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    @Inject(MXNEST_CONFIG_SERVICE)
    private readonly mxnestConfigService: MxnestConfigService
  ) { }

  // eslint-disable-next-line require-await
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {


    const admins = this.mxnestConfigService.getSecurityAdmins();
    if (!admins) {
      return false;
    }

    const request = ExecutionContextUtils.getRequest(context);

    return admins.includes(request.jwt.address);
  }
}
