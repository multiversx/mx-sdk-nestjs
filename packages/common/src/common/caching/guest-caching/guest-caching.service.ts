import {
  Injectable,
} from '@nestjs/common';
import moment from 'moment';
import * as crypto from 'crypto';
import { CachingService } from '../caching.service';
import { MetricsService } from '../../metrics/metrics.service';
import { DATE_FORMAT, GuestCacheMethodEnum, IGuestCacheOptions, REDIS_PREFIX } from '../entities/guest.caching';

const cacheHitsCounter: any = {};

@Injectable()
export class GuestCachingService {
  constructor(private cacheService: CachingService) { }

  public async getOrSetRequestCache(req: any, options?: IGuestCacheOptions) {
    if (
      (req.headers['authorization'] && !options?.ignoreAuthorizationHeader) || // if user is authenticated 
      req.headers['no-cache'] === 'true' || // if no-cache header is true
      (req.method !== GuestCacheMethodEnum.POST && req.method !== GuestCacheMethodEnum.GET) || // if method other than POST / GET
      (req.method === GuestCacheMethodEnum.POST && !req.originalUrl.includes('graphql')) // if POST method but not graphql
    ) {
      return { fromCache: false };
    }

    const url = req.guestCacheUrl ?? req.originalUrl;

    const redisValue = req.method === GuestCacheMethodEnum.POST ? {
      method: req.method,
      body: req.body,
      path: url,
    } : {
      method: req.method,
      path: url,
    };

    MetricsService.incrementGuestHits();

    const currentMinute = moment().format(DATE_FORMAT);
    const previousMinute = moment().subtract(1, 'minute').format(DATE_FORMAT);
    const gqlQueryMd5 = crypto.createHash('md5').update(JSON.stringify(redisValue)).digest('hex');

    const redisQueryKey = `${REDIS_PREFIX}.${gqlQueryMd5}.body`;
    const redisQueryResponse = `${REDIS_PREFIX}.${gqlQueryMd5}.response`;
    const batchSize = options?.batchSize || 3;

    let isFirstEntryForThisKey = false;

    if (!cacheHitsCounter[currentMinute]) {
      isFirstEntryForThisKey = true;
      cacheHitsCounter[currentMinute] = {};
    }

    const cacheHitsCurrentMinute = cacheHitsCounter[currentMinute];

    if (!cacheHitsCurrentMinute[gqlQueryMd5]) {
      cacheHitsCurrentMinute[gqlQueryMd5] = 0;
    }

    if (cacheHitsCurrentMinute[gqlQueryMd5] < batchSize) {
      cacheHitsCurrentMinute[gqlQueryMd5]++;
    } else {
      cacheHitsCurrentMinute[gqlQueryMd5] = 1;
    }

    const redisCounterKey = `${REDIS_PREFIX}.${currentMinute}`;
    if (cacheHitsCurrentMinute[gqlQueryMd5] >= batchSize) {
      await this.cacheService.setCache(redisQueryKey, redisValue);
      await this.cacheService.zIncrBy(redisCounterKey, cacheHitsCurrentMinute[gqlQueryMd5], gqlQueryMd5);
    }

    if (isFirstEntryForThisKey) {
      // If it is first entry for this key, set expire
      await this.cacheService.zIncrBy(redisCounterKey, 0, gqlQueryMd5);
      await this.cacheService.setTtlRemote(redisCounterKey, 2 * 60);
    }

    // If the value for this is already computed
    const cacheResponse: any = await this.cacheService.getCache(redisQueryResponse);

    // Delete data for previous minute
    if (cacheHitsCounter[previousMinute]) {
      delete cacheHitsCounter[previousMinute];
    }

    if (cacheResponse) {
      return {
        fromCache: true,
        response: cacheResponse,
      };
    }

    MetricsService.incrementGuestNoCacheHits();

    return {
      fromCache: false,
    };
  }
}
