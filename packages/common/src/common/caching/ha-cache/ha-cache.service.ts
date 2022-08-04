import { Injectable, Logger } from '@nestjs/common';
import { InMemoryCacheService } from '../in-memory-cache';
import { RedisCacheService } from '../redis-cache';

@Injectable()
export class HACacheService {
  private readonly DEFAULT_CACHE = 300;
  private readonly logger: Logger;

  constructor(
    private readonly inMemoryCacheService: InMemoryCacheService,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.logger = new Logger(HACacheService.name);
  }

  async get<T>(
    key: string,
  ): Promise<T | undefined> {
    const inMemoryCacheValue = await this.inMemoryCacheService.get<T>(key);
    if (inMemoryCacheValue) {
      return inMemoryCacheValue;
    }

    return await this.redisCacheService.get<T>(key);
  }

  set<T>(
    key: string,
    value: T,
    ttl: number = this.DEFAULT_CACHE,
    inMemoryTtl: number = ttl,
  ): Promise<void> {
    return this.setValue(key, value, ttl, inMemoryTtl);
  }

  async delete(
    key: string,
  ): Promise<void> {
    await this.redisCacheService.delete(key);
    await this.inMemoryCacheService.delete(key);
  }

  async getOrSet<T>(
    key: string,
    createValueFunc: () => T | Promise<T | undefined> | undefined,
    ttl: number = this.DEFAULT_CACHE,
    inMemoryTtl: number = ttl,
  ): Promise<T | undefined> {
    const getOrAddFromRedisFunc = async (): Promise<T | undefined> => {
      return await this.redisCacheService.getOrSet<T>(key, createValueFunc, ttl);
    };

    return await this.inMemoryCacheService.getOrSet<T>(key, getOrAddFromRedisFunc, inMemoryTtl);
  }

  async setOrUpdate<T>(
    key: string,
    createValueFunc: () => T | Promise<T>,
    ttl: number = this.DEFAULT_CACHE,
    inMemoryTtl: number = ttl,
  ): Promise<T | undefined> {
    const internalCreateValueFunc = this.buildInternalCreateValueFunc<T>(key, createValueFunc);
    const value = await internalCreateValueFunc();
    if (!value) {
      return;
    }

    await this.setValue<T>(key, value, ttl, inMemoryTtl);

    return value;
  }

  private async setValue<T>(
    key: string,
    value: T,
    ttl: number,
    inMemoryTtl: number = ttl,
  ): Promise<void> {
    const setInMemoryCachePromise = this.inMemoryCacheService.set<T>(key, value, inMemoryTtl);
    const setRedisCachePromise = this.redisCacheService.set<T>(key, value, ttl);

    await Promise.all([setInMemoryCachePromise, setRedisCachePromise]);
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
          this.logger.error('HACache - An error occurred while trying to load value.', {
            error: error?.toString(),
            key,
          });
        }
        return;
      }
    };
  }
}
