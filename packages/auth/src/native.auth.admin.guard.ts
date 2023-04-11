import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { ExecutionContextUtils, ErdnestConfigService, ERDNEST_CONFIG_SERVICE } from '@multiversx/sdk-nestjs-common';

/**
 * This Guard allows only specific addresses to be authenticated.
 * 
 * The addresses are defined in the config file and are passed to the guard via the ErdnestConfigService.
 *
 * @return {boolean} `canActivate` returns true if the address is in the list of admins and uses a valid Native-Auth token.
 * 
 * @param {CachingService} CachingService - Dependency of `NativeAuthGuard`
 * @param {ErdnestConfigService} ErdnestConfigService - Dependency of `NativeAuthGuard`. Also used to get the list of admins (`getSecurityAdmins`). 
 */
@Injectable()
export class NativeAuthAdminGuard implements CanActivate {
  constructor(
    @Inject(ERDNEST_CONFIG_SERVICE)
    private readonly erdnestConfigService: ErdnestConfigService
  ) { }

  canActivate(context: ExecutionContext): boolean {
    const admins = this.erdnestConfigService.getSecurityAdmins();
    if (!admins) {
      return false;
    }

    const request = ExecutionContextUtils.getRequest(context);

    return admins.includes(request.nativeAuth.address);
  }
}
