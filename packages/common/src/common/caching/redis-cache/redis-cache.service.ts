import { Injectable, Logger } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { MetricsService } from '../../../common/metrics/metrics.service';
import { PerformanceProfiler } from '../../../utils/performance.profiler';

@Injectable()
export class RedisCacheService {
  private readonly logger: Logger;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly metricsService: MetricsService,
  ) {
    this.logger = new Logger(RedisCacheService.name);
  }

  async get<T>(
    key: string,
  ): Promise<T | null> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      const data = await this.redis.get(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('RedisCache - An error occurred while trying to get from redis cache.', {
          error: error?.toString(),
          cacheKey: key,
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('GET', performanceProfiler.duration);
    }
    return null;
  }

  async getMany<T>(
    keys: string[],
  ): Promise<(T | null)[]> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      const items = await this.redis.mget(keys);
      return items.map(item => item ? JSON.parse(item) : null);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to get many keys from redis cache.',
          {
            exception: error?.toString(),
            cacheKeys: keys,
          });
      }
      return [];
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('MGET', performanceProfiler.duration);
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number | null,
  ): Promise<void> {
    if (isNil(value)) {
      return;
    }
    const performanceProfiler = new PerformanceProfiler();
    try {
      if (!ttl) {
        await this.redis.set(key, JSON.stringify(value));
      } else {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('RedisCache - An error occurred while trying to set in redis cache.', {
          error: error?.toString(),
          cacheKey: key,
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('SET', performanceProfiler.duration);
    }
  }

  async setMany<T>(
    keys: string[],
    values: T[],
    ttl: number,
  ): Promise<void> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      const commands = keys.map((key, index) => {
        return ['set', key, JSON.stringify(values[index]), 'EX', ttl.toString()];
      });
      await this.redis.multi(commands);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('RedisCache - An error occurred while trying to set many in redis cache.', {
          error: error?.toString(),
          cacheKey: keys,
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('SETMANY', performanceProfiler.duration);
    }
  }

  async expire(
    key: string,
    ttl: number,
  ): Promise<void> {
    await this.redis.expire(key, ttl);
  }

  async delete(
    key: string,
  ): Promise<void> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      await this.redis.del(key);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('RedisCache - An error occurred while trying to delete from redis cache.', {
          error: error?.toString(),
          cacheKey: key,
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('DEL', performanceProfiler.duration);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      await this.redis.del(keys);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to delete multiple keys from redis cache.', {
          error: error?.toString(),
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('DELMANY', performanceProfiler.duration);
    }
  }

  async flushDb(): Promise<void> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      await this.redis.flushdb();
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to delete multiple keys from redis cache.', {
          error: error?.toString(),
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('FLUSHDB', performanceProfiler.duration);
    }
  }

  async getOrSet<T>(
    key: string,
    createValueFunc: () => Promise<T | null>,
    ttl: number,
  ): Promise<T | null> {
    const cachedData = await this.get<T>(key);
    if (!isNil(cachedData)) {
      return cachedData;
    }

    const internalCreateValueFunc = this.buildInternalCreateValueFunc<T>(key, createValueFunc);
    const value = await internalCreateValueFunc();
    if (!value) {
      return null;
    }
    await this.set<T>(key, value, ttl);
    return value;
  }

  async setOrUpdate<T>(
    key: string,
    createValueFunc: () => Promise<T | null>,
    ttl: number,
  ): Promise<T | null> {
    const internalCreateValueFunc = this.buildInternalCreateValueFunc<T>(key, createValueFunc);
    const value = await internalCreateValueFunc();
    if (!value) {
      return null;
    }
    await this.set<T>(key, value, ttl);
    return value;
  }

  async scan(pattern: string): Promise<string[]> {
    const found: string[] = [];
    let cursor = '0';
    do {
      const reply = await this.redis.scan(cursor, 'MATCH', pattern);

      cursor = reply[0];
      found.push(...reply[1]);
    } while (cursor !== '0');

    return found;
  }

  async increment(
    key: string,
    ttl: number | null = null,
  ): Promise<number> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      const newValue = await this.redis.incr(key);
      if (ttl) {
        await this.expire(key, ttl);
      }
      return newValue;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('RedisCache - An error occurred while trying to increment redis key.', {
          error: error?.toString(),
          cacheKey: key,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('INCR', performanceProfiler.duration);
    }
  }

  async decrement(
    key: string,
    ttl: number | null = null,
  ): Promise<number> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      const newValue = await this.redis.decr(key);
      if (ttl) {
        await this.expire(key, ttl);
      }
      return newValue;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('RedisCache - An error occurred while trying to decrement redis key.', {
          error: error?.toString(),
          cacheKey: key,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('DECR', performanceProfiler.duration);
    }
  }

  private buildInternalCreateValueFunc<T>(
    key: string,
    createValueFunc: () => Promise<T | null>,
  ): () => Promise<T | null> {
    return async () => {
      try {
        return await createValueFunc();
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error('RedisCache - An error occurred while trying to load value.', {
            error: error?.toString(),
            key,
          });
        }
        return null;
      }
    };
  }
}
