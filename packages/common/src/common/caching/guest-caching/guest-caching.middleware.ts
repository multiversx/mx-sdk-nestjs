import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import moment from 'moment';
import * as crypto from 'crypto';
import { CachingService } from '../caching.service';
import { MetricsService } from '../../../common/metrics/metrics.service';
import { DATE_FORMAT, GuestCacheMethodEnum, REDIS_PREFIX } from '../entities/guest.caching';

const cacheHitsCounter: any = {};

@Injectable()
export class GuestCachingMiddleware implements NestMiddleware {

  constructor(private cacheService: CachingService) { }

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

    const redisValue = req.method === GuestCacheMethodEnum.POST ? {
      method: req.method,
      body: req.body,
      path: req.originalUrl,
    } : {
      method: req.method,
      path: req.originalUrl,
    };

    MetricsService.incrementGuestHits();

    const currentMinute = moment().format(DATE_FORMAT);
    const previousMinute = moment().subtract(1, 'minute').format(DATE_FORMAT);
    const gqlQueryMd5 = crypto.createHash('md5').update(JSON.stringify(redisValue)).digest('hex');

    const redisQueryKey = `${REDIS_PREFIX}.${gqlQueryMd5}.body`;
    const redisQueryResponse = `${REDIS_PREFIX}.${gqlQueryMd5}.response`;
    const batchSize = Number(process.env.GUEST_CACHE_REDIS_BATCH_SIZE) || 3;

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

    res.setHeader('X-Guest-Cache-Hit', !!cacheResponse);

    // Delete data for previous minute
    if (cacheHitsCounter[previousMinute]) {
      delete cacheHitsCounter[previousMinute];
    }

    if (cacheResponse) {
      return res.json(cacheResponse);
    } else {
      MetricsService.incrementGuestNoCacheHits();
    }

    return next();
  }
}
