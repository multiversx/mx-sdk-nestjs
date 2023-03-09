import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PerformanceProfiler } from '../../utils/performance.profiler';
import { MetricsService } from '../metrics/metrics.service';
import { SWAPPABLE_SETTINGS_REDIS_CLIENT } from './entities/constants';

@Injectable()
export class SwappableSettingsService {
  private readonly prefix = 'swappable-setting:';

  constructor(
    @Inject(SWAPPABLE_SETTINGS_REDIS_CLIENT) private readonly redisService: Redis,
  ) { }

  public async get(key: string): Promise<any | null> {
    const profiler = new PerformanceProfiler();
    const data = await this.redisService.get(`${this.prefix}${key}`);
    profiler.stop();
    MetricsService.setRedisCommonDuration('GET', profiler.duration);
    return data;
  }

  public async set(key: string, value: string): Promise<void> {
    const profiler = new PerformanceProfiler();
    await this.redisService.set(`${this.prefix}${key}`, value);
    profiler.stop();
    MetricsService.setRedisCommonDuration('SET', profiler.duration);
  }

  public async delete(key: string): Promise<void> {
    const profiler = new PerformanceProfiler();
    await this.redisService.del(`${this.prefix}${key}`);
    profiler.stop();
    MetricsService.setRedisCommonDuration('DEL', profiler.duration);
  }
}
