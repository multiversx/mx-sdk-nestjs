import { Injectable } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { HACacheService } from '../ha-cache/ha-cache.service';
import { InMemoryCacheService } from '../in-memory-cache/in-memory-cache.service';
import { RedisCacheService } from '../redis-cache/redis-cache.service';

@Injectable()
export class ElrondCachingService {
  private readonly pendingPromises: { [key: string]: Promise<any> } = {};

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

  getManyLocal<T>(
    keys: string[],
  ): Promise<(T | undefined)[]> {
    return this.inMemoryCacheService.getMany<T>(keys);
  }

  setLocal<T>(
    key: string,
    value: T,
    ttl: number,
  ): Promise<void> {
    if (isNil(value)) {
      return Promise.resolve();
    }

    return this.inMemoryCacheService.set<T>(key, value, ttl);
  }

  setManyLocal<T>(
    keys: string[],
    values: T[],
    ttl: number,
  ): Promise<void> {
    return this.inMemoryCacheService.setMany(keys, values, ttl);
  }

  deleteLocal(
    key: string,
  ): Promise<void> {
    return this.inMemoryCacheService.delete(key);
  }

  async deleteManyLocal(
    keys: string[],
  ): Promise<void> {
    await Promise.all(
      keys.map(key => this.inMemoryCacheService.delete(key)),
    );
  }

  getOrSetLocal<T>(
    key: string,
    createValueFunc: () => Promise<T | null>,
    ttl: number,
  ): Promise<T | undefined> {
    return this.inMemoryCacheService.getOrSet<T>(
      key,
      () => {
        return this.executeWithPendingPromise(key, createValueFunc);
      },
      ttl,
    );
  }

  setOrUpdateLocal<T>(
    key: string,
    createValueFunc: () => Promise<T | undefined>,
    ttl: number,
  ): Promise<T | undefined> {
    return this.inMemoryCacheService.setOrUpdate<T>(key, createValueFunc, ttl);
  }

  getRemote<T>(
    key: string,
  ): Promise<T | null> {
    return this.redisCacheService.get<T>(key);
  }

  getManyRemote<T>(
    keys: string[]
  ): Promise<(T | null)[]> {
    return this.redisCacheService.getMany(keys);
  }

  setRemote<T>(
    key: string,
    value: T,
    ttl: number | null,
  ): Promise<void> {
    return this.redisCacheService.set<T>(key, value, ttl);
  }

  async setManyRemote<T>(
    keys: string[],
    values: T[],
    ttl: number,
  ): Promise<void> {
    await this.redisCacheService.setMany(keys, values, ttl);
  }

  setTtlRemote(
    key: string,
    ttl: number,
  ): Promise<void> {
    return this.redisCacheService.expire(key, ttl);
  }

  deleteRemote(
    key: string,
  ): Promise<void> {
    return this.redisCacheService.delete(key);
  }

  deleteManyRemote(
    keys: string[],
  ): Promise<void> {
    return this.redisCacheService.deleteMany(keys);
  }

  flushDbRemote(): Promise<void> {
    return this.redisCacheService.flushDb();
  }

  getOrSetRemote<T>(
    key: string,
    createValueFunc: () => Promise<T | null>,
    ttl: number,
  ): Promise<T | null> {
    return this.executeWithPendingPromise(
      key,
      () => this.redisCacheService.getOrSet<T>(key, createValueFunc, ttl),
    );
  }

  setOrUpdateRemote<T>(
    key: string,
    createValueFunc: () => Promise<T | null>,
    ttl: number,
  ): Promise<T | null> {
    return this.redisCacheService.setOrUpdate<T>(key, createValueFunc, ttl);
  }

  incrementRemote(
    key: string,
    ttl: number | null,
  ): Promise<number> {
    return this.redisCacheService.increment(key, ttl);
  }

  decrementRemote(
    key: string,
    ttl: number | null,
  ): Promise<number> {
    return this.redisCacheService.decrement(key, ttl);
  }

  get<T>(
    key: string,
  ): Promise<T | null> {
    return this.haCacheService.get<T>(key);
  }

  async getMany<T>(
    keys: string[],
  ): Promise<(T | undefined)[]> {
    const values = await this.getManyLocal<T>(keys);

    const missingIndexes: number[] = [];
    values.forEach((value, index) => {
      if (!value) {
        missingIndexes.push(index);
      }
    });

    const missingKeys: string[] = [];
    for (const missingIndex of missingIndexes) {
      missingKeys.push(keys[missingIndex]);
    }

    const remoteValues = await this.getManyRemote<T>(missingKeys);

    for (const [index, missingIndex] of missingIndexes.entries()) {
      const remoteValue = remoteValues[index];
      values[missingIndex] = remoteValue ? remoteValue : undefined;
    }

    return values;
  }

  set<T>(
    key: string,
    value: T,
    ttl: number,
    inMemoryTtl: number = ttl,
  ): Promise<void> {
    return this.haCacheService.set(key, value, ttl, inMemoryTtl);
  }

  async setMany<T>(
    keys: string[],
    values: T[],
    ttl: number,
  ): Promise<void> {
    await Promise.all([
      this.setManyRemote(keys, values, ttl),
      this.setManyLocal(keys, values, ttl),
    ]);
  }

  delete(
    key: string,
  ): Promise<void> {
    return this.haCacheService.delete(key);
  }

  async deleteMany(
    keys: string[],
  ): Promise<void> {
    await this.redisCacheService.deleteMany(keys);
    await this.deleteManyLocal(keys);
  }

  getOrSet<T>(
    key: string,
    createValueFunc: () => Promise<T | null>,
    ttl: number,
    inMemoryTtl: number = ttl,
  ): Promise<T | undefined> {
    return this.executeWithPendingPromise(
      key,
      () => this.haCacheService.getOrSet<T>(key, createValueFunc, ttl, inMemoryTtl),
    );
  }

  setOrUpdate<T>(
    key: string,
    createValueFunc: () => Promise<T | undefined>,
    ttl: number,
    inMemoryTtl: number = ttl,
  ): Promise<T | undefined> {
    return this.haCacheService.setOrUpdate<T>(key, createValueFunc, ttl, inMemoryTtl);
  }

  executeWithPendingPromise<T>(
    key: string,
    promise: () => Promise<T>,
  ): Promise<T> {
    const pendingPromise = this.pendingPromises[key];
    if (pendingPromise) {
      return pendingPromise;
    }

    try {
      return this.pendingPromises[key] = promise();
    } finally {
      delete this.pendingPromises[key];
    }
  }
}
