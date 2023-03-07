import { Injectable } from '@nestjs/common';
import { PerformanceProfiler } from '../../utils/performance.profiler';
import { RedisCacheService } from '../caching/redis-cache';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class SwappableSettingsService {
  private readonly prefix = 'swappable-setting:';

  constructor(
    private readonly redisCacheService: RedisCacheService,
  ) { }

  public async get(key: string): Promise<any | null> {
    const profiler = new PerformanceProfiler();
    const data = await this.redisCacheService.get(`${this.prefix}${key}`);
    profiler.stop();
    MetricsService.setRedisCommonDuration('GET', profiler.duration);
    return data;
  }

  public async set(key: string, value: string): Promise<void> {
    const profiler = new PerformanceProfiler();
    await this.redisCacheService.set(`${this.prefix}${key}`, value);
    profiler.stop();
    MetricsService.setRedisCommonDuration('SET', profiler.duration);
  }

  public async delete(key: string): Promise<void> {
    const profiler = new PerformanceProfiler();
    await this.redisCacheService.delete(`${this.prefix}${key}`);
    profiler.stop();
    MetricsService.setRedisCommonDuration('DEL', profiler.duration);
  }
}
