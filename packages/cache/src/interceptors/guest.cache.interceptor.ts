import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, of } from "rxjs";
import { NoCacheOptions, DecoratorUtils } from "@multiversx/sdk-nestjs-common";
import { IGuestCacheOptions } from "../entities/guest.caching";
import { GuestCacheService } from "../guest-cache/guest-cache.service";

@Injectable()
export class GuestCacheInterceptor implements NestInterceptor {
  private guestCacheOptions;

  constructor(
    private readonly guestCacheService: GuestCacheService,
    guestCacheOptions?: IGuestCacheOptions
  ) {
    this.guestCacheOptions = guestCacheOptions;
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

    const cacheResult = await this.guestCacheService.getOrSetRequestCache(request, this.guestCacheOptions);
    if (cacheResult.fromCache) {
      return of(cacheResult.response);
    }

    return next.handle();
  }
}
