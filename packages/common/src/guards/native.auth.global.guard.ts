import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { ErdnestConfigService } from "../common/config/erdnest.config.service";
import { NoAuthOptions } from "../decorators/no.auth";
import { DecoratorUtils } from "../utils/decorator.utils";
import { ERDNEST_CONFIG_SERVICE } from "../utils/erdnest.constants";
import { NativeAuthGuard } from "./native.auth.guard";
import { CachingService } from "../common/caching/caching.service";

/**
 * This Guard can be registered as a global guard and will protect all routes that do not have the `@NoAuth` decorator.
 *
 * @return {boolean} `canActivate` returns true if the Authorization header is a valid Native-Auth token.
 * 
 * @param {CachingService} CachingService - Dependency of `NativeAuthGuard`
 * @param {ErdnestConfigService} ErdnestConfigService - Dependency of `NativeAuthGuard`
 * 
 * @example <caption>Example of guard registration</caption>
 *   nestjsApp.useGlobalGuards(new NativeAuthGlobalGuard(cachingService, new ErdnestConfigServiceImpl(apiConfigService)));
 */
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
