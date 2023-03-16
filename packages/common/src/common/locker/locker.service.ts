import { Inject, Injectable } from "@nestjs/common";
import { Redis } from 'ioredis';
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { MetricsService } from "../metrics/metrics.service";
import { LOCKER_REDIS_CLIENT } from "./entities/constants";

@Injectable()
export class LockerService {
  constructor(
    @Inject(LOCKER_REDIS_CLIENT) private readonly redisService: Redis,
  ) { }

  public async isLockAcquired(key: string, ttl: number): Promise<boolean> {
    const lockAcquired = await this.setnx(key, 'true', ttl);
    return lockAcquired;
  }

  private async setnx<T>(key: string, value: T, ttl: number): Promise<boolean> {
    const profiler = new PerformanceProfiler();

    const result = await this.redisService.set(key, JSON.stringify(value), 'EX', ttl, 'NX');

    profiler.stop();
    MetricsService.setRedisCommonDuration('SET', profiler.duration);

    return result === 'OK';
  }
}
