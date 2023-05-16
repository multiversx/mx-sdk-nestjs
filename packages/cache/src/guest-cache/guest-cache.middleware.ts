import {
  Injectable,
  NestMiddleware,
  mixin,
  Type,
} from '@nestjs/common';
import { IGuestCacheOptions } from '../entities/guest.caching';
import { GuestCacheService } from './guest-cache.service';

export const GuestCacheMiddlewareCreator = (options?: IGuestCacheOptions): Type<NestMiddleware> => {
  @Injectable()
  class GuestCacheMiddleware implements NestMiddleware {

    constructor(private guestCaching: GuestCacheService) { }

    async use(req: any, res: any, next: any) {
      const cacheResult = await this.guestCaching.getOrSetRequestCache(req, options);

      if (cacheResult.fromCache) {
        res.setHeader('X-Guest-Cache-Hit', cacheResult.fromCache);
        return res.json(cacheResult.response);
      }

      return next();
    }
  }

  return mixin(GuestCacheMiddleware);
};
