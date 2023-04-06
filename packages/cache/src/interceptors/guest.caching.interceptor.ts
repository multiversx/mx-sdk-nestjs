import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, of } from "rxjs";
import { NoCacheOptions } from "@multiversx/sdk-nestjs-common/src/decorators";
import { DecoratorUtils } from "@multiversx/sdk-nestjs-common/src/utils/decorator.utils";
import { IGuestCacheOptions } from "../entities/guest.caching";
import { GuestCachingService } from "../guest-caching/guest-caching.service";

@Injectable()
export class GuestCachingInterceptor implements NestInterceptor {
  private guestCachingOptions;

  constructor(
    private readonly guestCachingService: GuestCachingService,
    guestCachingOptions?: IGuestCacheOptions
  ) {
    this.guestCachingOptions = guestCachingOptions;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const request = context.getArgByIndex(0);
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cachingMetadata = DecoratorUtils.getMethodDecorator(NoCacheOptions, context.getHandler());
    if (cachingMetadata) {
      return next.handle();
    }

    const cacheResult = await this.guestCachingService.getOrSetRequestCache(request, this.guestCachingOptions);
    if (cacheResult.fromCache) {
      return of(cacheResult.response);
    }

    return next.handle();
  }
}
