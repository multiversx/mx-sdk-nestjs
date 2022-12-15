import {
  Injectable,
  NestMiddleware,
  mixin,
  Type,
} from '@nestjs/common';
import { GuestCacheMethodEnum, IGuestCacheOptions } from '../entities/guest.caching';
import { GuestCachingService } from './guest-caching.service';


export const GuestCachingMiddlewareCreator = (options?: IGuestCacheOptions): Type<NestMiddleware> => {
  @Injectable()
  class GuestCachingMiddleware implements NestMiddleware {

    constructor(private guestCaching: GuestCachingService) { }

    async use(req: any, res: any, next: any) {
      if (
        req.headers['authorization'] || // if user is authenticated 
        req.headers['no-cache'] === 'true' || // if no-cache header is true
        (req.method !== GuestCacheMethodEnum.POST && req.method !== GuestCacheMethodEnum.GET) || // if method other than POST / GET
        (req.method === GuestCacheMethodEnum.POST && !req.originalUrl.includes('graphql')) // if POST method but not graphql
      ) {
        // skip guest cache middleware
        return next();
      }

      const cacheResult = await this.guestCaching.getOrSetRequestCache(req, options);
      res.setHeader('X-Guest-Cache-Hit', cacheResult.fromCache);

      if (cacheResult.fromCache) {
        return res.json(cacheResult.response);
      }

      return next();
    }
  }

  return mixin(GuestCachingMiddleware);
};
