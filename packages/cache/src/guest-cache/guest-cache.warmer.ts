import moment from 'moment';
import axios from 'axios';
import { Injectable } from '@nestjs/common';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/array.extensions';
import { RedisCacheService } from '../redis-cache';
import { MetricsService, PerformanceProfiler } from '@multiversx/sdk-nestjs-monitoring';
import { DATE_FORMAT, GuestCacheMethodEnum, IGuestCacheEntity, IGuestCacheWarmerOptions, REDIS_PREFIX } from '../entities/guest.caching';

@Injectable()
export class GuestCacheWarmer {

  constructor(
    private readonly cacheService: RedisCacheService,
  ) { }

  private async getReq(url: string) {
    const { data } = await axios.get(url, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    return data;
  }

  private async postReq(url: string, body: any) {
    const { data } = await axios.post(url, body, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    return data;
  }

  public async recompute(options: IGuestCacheWarmerOptions) {
    // recompute cache
    const currentDate = moment().format(DATE_FORMAT);
    const previousMinute = moment().subtract(1, 'minute').format(DATE_FORMAT);
    const threshold = Number(options.cacheTriggerHitsThreshold || 100);
    const keysToComputeCurrentMinute: string[] = await this.cacheService.zrangebyscore(`${REDIS_PREFIX}.${currentDate}.hits`, threshold, '+inf');
    const keysToComputePreviousMinute: string[] = await this.cacheService.zrangebyscore(`${REDIS_PREFIX}.${previousMinute}.hits`, threshold, '+inf');

    const keysToCompute = [...keysToComputeCurrentMinute, ...keysToComputePreviousMinute].distinct();
    await Promise.allSettled(keysToCompute.map(async key => {
      const parsedKey = `${REDIS_PREFIX}.${key}.body`;
      const keyValue: IGuestCacheEntity | undefined = await this.cacheService.get(parsedKey);

      if (!keyValue) {
        return Promise.resolve();
      }

      console.log(`Started warming up query '${JSON.stringify(keyValue)}' for url '${options.targetUrl}'`);
      const profiler = new PerformanceProfiler();

      let data;
      try {
        const url = `${options.targetUrl}${keyValue.path}`;

        if (keyValue.method === GuestCacheMethodEnum.GET) {
          data = await this.getReq(url);
        } else {
          data = await this.postReq(url, keyValue.body);
        }
      } catch (error) {
        console.error(`An error occurred while warming up query '${JSON.stringify(keyValue)}' for url '${options.targetUrl}'`);
        await this.cacheService.delete(parsedKey);
        console.error(error);
      }

      profiler.stop();

      console.log(`Finished warming up query '${JSON.stringify(keyValue)}' for url '${options.targetUrl}'. Response size: ${JSON.stringify(data).length}. Duration: ${profiler.duration}`);

      return this.cacheService.set(`${REDIS_PREFIX}.${key}.response`, data, options.cacheTtl ?? 30);
    }));

    MetricsService.setGuestHitQueries(keysToCompute.length);
  }
}
