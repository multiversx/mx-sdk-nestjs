import {
  Injectable,
  NestMiddleware,
  mixin,
  Type,
} from '@nestjs/common';
import { IGuestCacheOptions } from '../entities/guest.caching';
import { GuestCachingService } from './guest-caching.service';


export const GuestCachingMiddlewareCreator = (options?: IGuestCacheOptions): Type<NestMiddleware> => {
  @Injectable()
  class GuestCachingMiddleware implements NestMiddleware {

    constructor(private guestCaching: GuestCachingService) { }

    async use(req: any, res: any, next: any) {
      const cacheResult = await this.guestCaching.getOrSetRequestCache(req, options);

      if (cacheResult.fromCache) {
        res.setHeader('X-Guest-Cache-Hit', cacheResult.fromCache);
        return res.json(cacheResult.response);
      }

      return next();
    }
  }

  return mixin(GuestCachingMiddleware);
};
