import { Injectable } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { HACacheService } from '../ha-cache/ha-cache.service';
import { InMemoryCacheService } from '../in-memory-cache/in-memory-cache.service';
import { RedisCacheService } from '../redis-cache/redis-cache.service';

@Injectable()
export class ElrondCachingService {
  private readonly DEFAULT_TTL = 300;

  constructor(
    private readonly inMemoryCacheService: InMemoryCacheService,
    private readonly redisCacheService: RedisCacheService,
    private readonly haCacheService: HACacheService,
  ) { }

  getLocal<T>(
    key: string,
  ): Promise<T | undefined> {
    return this.inMemoryCacheService.get<T>(key);
  }

  setLocal<T>(
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    if (isNil(value)) {
      return Promise.resolve();
    }

    return this.inMemoryCacheService.set<T>(key, value, ttl);
  }

  deleteLocal(
    key: string,
  ): Promise<void> {
    return this.inMemoryCacheService.delete(key);
  }

  getOrSetLocal<T>(
    key: string,
    createValueFunc: () => T | Promise<T | undefined>,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T | undefined> {
    return this.inMemoryCacheService.getOrSet<T>(key, createValueFunc, ttl);
  }

  setOrUpdateLocal<T>(
    key: string,
    createValueFunc: () => T | Promise<T | undefined> | undefined,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T | undefined> {
    return this.inMemoryCacheService.setOrUpdate<T>(key, createValueFunc, ttl);
  }

  getRemote<T>(
    key: string,
  ): Promise<T | undefined> {
    return this.redisCacheService.get<T>(key);
  }

  setRemote<T>(
    key: string,
    value: T,
    ttl: number | null = null,
  ): Promise<void> {
    return this.redisCacheService.set<T>(key, value, ttl);
  }

  deleteRemote(
    key: string,
  ): Promise<void> {
    return this.redisCacheService.delete(key);
  }

  deleteMultipleRemote(
    keys: string[],
  ): Promise<void> {
    return this.redisCacheService.deleteMultiple(keys);
  }

  getOrSetRemote<T>(
    key: string,
    createValueFunc: () => T | Promise<T | undefined> | undefined,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T | undefined> {
    return this.redisCacheService.getOrSet<T>(key, createValueFunc, ttl);
  }

  setOrUpdateRemote<T>(
    key: string,
    createValueFunc: () => T | Promise<T | undefined> | undefined,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T | undefined> {
    return this.redisCacheService.setOrUpdate<T>(key, createValueFunc, ttl);
  }

  incrementRemote(
    key: string,
    ttl: number | null = null,
  ): Promise<number> {
    return this.redisCacheService.increment(key, ttl);
  }

  decrementRemote(
    key: string,
    ttl: number | null = null,
  ): Promise<number> {
    return this.redisCacheService.decrement(key, ttl);
  }

  get<T>(
    key: string,
  ): Promise<T | undefined> {
    return this.haCacheService.get<T>(key);
  }

  set<T>(
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
    inMemoryTtl: number = ttl,
  ): Promise<void> {
    return this.haCacheService.set(key, value, ttl, inMemoryTtl);
  }

  delete(
    key: string,
  ): Promise<void> {
    return this.haCacheService.delete(key);
  }

  getOrSet<T>(
    key: string,
    createValueFunc: () => T | Promise<T | undefined> | undefined,
    ttl: number = this.DEFAULT_TTL,
    inMemoryTtl: number = ttl,
  ): Promise<T | undefined> {
    return this.haCacheService.getOrSet<T>(key, createValueFunc, ttl, inMemoryTtl);
  }

  setOrUpdate<T>(
    key: string,
    createValueFunc: () => T | Promise<T>,
    ttl: number = this.DEFAULT_TTL,
    inMemoryTtl: number = ttl,
  ): Promise<T | undefined> {
    return this.haCacheService.setOrUpdate<T>(key, createValueFunc, ttl, inMemoryTtl);
  }
}
