import { Injectable, Logger } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';

@Injectable()
export class RedisCacheService {
  private readonly DEFAULT_TTL = 300;
  private readonly logger: Logger;

  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.logger = new Logger(RedisCacheService.name);
  }

  async get<T>(
    key: string,
  ): Promise<T | undefined> {
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
    }
    return;
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number | null = null,
  ): Promise<void> {
    if (isNil(value)) {
      return;
    }
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
    }
  }

  async delete(
    key: string,
  ): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('RedisCache - An error occurred while trying to delete from redis cache.', {
          error: error?.toString(),
          cacheKey: key,
        });
      }
    }
  }

  async deleteMultiple(keys: string[]): Promise<void> {
    try {
      await this.redis.del(keys);
    } catch (err) {
      this.logger.error('An error occurred while trying to delete multiple keys from redis cache.');
    }
  }

  async getOrSet<T>(
    key: string,
    createValueFunc: () => T | Promise<T | undefined> | undefined,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T | undefined> {
    const cachedData = await this.get<T>(key);
    if (!isNil(cachedData)) {
      return cachedData;
    }

    const internalCreateValueFunc = this.buildInternalCreateValueFunc<T>(key, createValueFunc);
    const value = await internalCreateValueFunc();
    if (!value) {
      return;
    }
    await this.set<T>(key, value, ttl);
    return value;
  }

  async setOrUpdate<T>(
    key: string,
    createValueFunc: () => T | Promise<T | undefined> | undefined,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T | undefined> {
    const internalCreateValueFunc = this.buildInternalCreateValueFunc<T>(key, createValueFunc);
    const value = await internalCreateValueFunc();
    if (!value) {
      return;
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
    try {
      const newValue = await this.redis.incr(key);
      if (ttl) {
        await this.redis.expire(key, ttl);
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
    }
  }

  async decrement(
    key: string,
    ttl: number | null = null,
  ): Promise<number> {
    try {
      const newValue = await this.redis.decr(key);
      if (ttl) {
        await this.redis.expire(key, ttl);
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
    }
  }

  private buildInternalCreateValueFunc<T>(
    key: string,
    createValueFunc: () => T | Promise<T | undefined> | undefined,
  ): () => Promise<T | undefined> {
    return async () => {
      try {
        let data = createValueFunc();
        if (data instanceof Promise) {
          data = await data;
        }
        return data;
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error('RedisCache - An error occurred while trying to load value.', {
            error: error?.toString(),
            key,
          });
        }
        return;
      }
    };
  }
}
