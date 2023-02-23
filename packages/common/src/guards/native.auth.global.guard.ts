import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { ErdnestConfigService } from "../common/config/erdnest.config.service";
import { NoAuthOptions } from "../decorators/no.auth";
import { DecoratorUtils } from "../utils/decorator.utils";
import { ERDNEST_CONFIG_SERVICE } from "../utils/erdnest.constants";
import { NativeAuthGuard } from "./native.auth.guard";
import { CachingService } from "../common/caching/caching.service";

@Injectable()
export class NativeAuthGlobalGuard implements CanActivate {
  constructor(
    private readonly cachingService: CachingService,
    @Inject(ERDNEST_CONFIG_SERVICE)
    private readonly erdnestConfigService: ErdnestConfigService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const noAuthMetadata = DecoratorUtils.getMethodDecorator(NoAuthOptions, context.getHandler());
    if (noAuthMetadata) {
      return true;
    }

    try {
      const nativeAuthGuard = new NativeAuthGuard(this.cachingService, this.erdnestConfigService);
      return await nativeAuthGuard.canActivate(context);
    } catch (error) {
      return false;
    }
  }
}
