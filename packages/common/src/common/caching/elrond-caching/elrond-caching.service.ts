import { Injectable, Logger } from '@nestjs/common';
import { PendingExecuter } from '../../../utils/pending.executer';
import { InMemoryCacheService } from '../in-memory-cache/in-memory-cache.service';
import { RedisCacheService } from '../redis-cache/redis-cache.service';

@Injectable()
export class ElrondCachingService {
  private readonly pendingExecuter: PendingExecuter;
  private readonly logger: Logger;

  constructor(
    private readonly inMemoryCacheService: InMemoryCacheService,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.logger = new Logger(ElrondCachingService.name);
    this.pendingExecuter = new PendingExecuter();
  }

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
    createValueFunc: () => Promise<T | null | undefined>,
    ttl: number,
  ): Promise<T | null | undefined> {
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
    createValueFunc: () => Promise<T | null | undefined>,
    ttl: number,
  ): Promise<T | null | undefined> {
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
    ttl: number | null = null,
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
    createValueFunc: () => Promise<T | null | undefined>,
    ttl: number,
  ): Promise<T | null | undefined> {
    return this.redisCacheService.getOrSet<T>(
      key,
      () => {
        return this.executeWithPendingPromise(key, createValueFunc);
      },
      ttl,
    );
  }

  setOrUpdateRemote<T>(
    key: string,
    createValueFunc: () => Promise<T | null | undefined>,
    ttl: number,
  ): Promise<T | null | undefined> {
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

  async get<T>(
    key: string,
  ): Promise<T | null> {
    const inMemoryCacheValue = await this.inMemoryCacheService.get<T>(key);
    if (inMemoryCacheValue) {
      return inMemoryCacheValue;
    }

    return await this.redisCacheService.get<T>(key);
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

  async set<T>(
    key: string,
    value: T,
    ttl: number,
    inMemoryTtl: number = ttl,
  ): Promise<void> {
    const setInMemoryCachePromise = this.inMemoryCacheService.set<T>(key, value, inMemoryTtl);
    const setRedisCachePromise = this.redisCacheService.set<T>(key, value, ttl);

    await Promise.all([setInMemoryCachePromise, setRedisCachePromise]);
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

  async delete(
    key: string,
  ): Promise<void> {
    await this.redisCacheService.delete(key);
    await this.inMemoryCacheService.delete(key);
  }

  async deleteMany(
    keys: string[],
  ): Promise<void> {
    await this.deleteManyRemote(keys);
    await this.deleteManyLocal(keys);
  }

  async getOrSet<T>(
    key: string,
    createValueFunc: () => Promise<T | null | undefined>,
    ttl: number,
    inMemoryTtl: number = ttl,
  ): Promise<T | null | undefined> {
    const internalCreateValueFunc = this.buildInternalCreateValueFunc<T>(key, createValueFunc);
    const getOrAddFromRedisFunc = async (): Promise<T | null | undefined> => {
      return await this.redisCacheService.getOrSet<T>(key, internalCreateValueFunc, ttl);
    };

    return await this.inMemoryCacheService.getOrSet<T>(key, getOrAddFromRedisFunc, inMemoryTtl);
  }

  async setOrUpdate<T>(
    key: string,
    createValueFunc: () => Promise<T | null | undefined>,
    ttl: number,
    inMemoryTtl: number = ttl,
  ): Promise<T | null | undefined> {
    const internalCreateValueFunc = this.buildInternalCreateValueFunc<T>(key, createValueFunc);
    const value = await internalCreateValueFunc();
    if (value != null) {
      await this.set<T>(key, value, ttl, inMemoryTtl);
    }
    return value;
  }

  private executeWithPendingPromise<T>(
    key: string,
    promise: () => Promise<T>,
  ): Promise<T> {
    return this.pendingExecuter.execute(key, promise);
  }

  private buildInternalCreateValueFunc<T>(
    key: string,
    createValueFunc: () => Promise<T | null | undefined>,
  ): () => Promise<T | null | undefined> {
    return async () => {
      try {
        return await this.executeWithPendingPromise(key, createValueFunc);
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error('ElrondCaching - An error occurred while trying to load value.', {
            error: error?.toString(),
            key,
          });
        }
        return null;
      }
    };
  }
}
