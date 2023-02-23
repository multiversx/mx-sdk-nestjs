import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { ErdnestConfigService } from '../common/config/erdnest.config.service';
import { ERDNEST_CONFIG_SERVICE } from '../utils/erdnest.constants';

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

    const request = context.switchToHttp().getRequest();

    const { address } = request.nativeAuth;
    return admins.includes(address);
  }
}
