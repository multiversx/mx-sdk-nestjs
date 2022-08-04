import {
  Injectable, Inject, CACHE_MANAGER,
} from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { Cache } from 'cache-manager';

@Injectable()
export class InMemoryCacheService {
  private readonly DEFAULT_TTL = 300;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) { }

  get<T>(
    key: string,
  ): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    if (isNil(value)) {
      return;
    }

    await this.cache.set<T>(key, value, {
      ttl,
    });
  }

  async delete(
    key: string,
  ): Promise<void> {
    await this.cache.del(key);
  }

  async getOrSet<T>(
    key: string,
    createValueFunc: () => T | Promise<T | undefined>,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T | undefined> {
    const cachedData = await this.get<T>(key);
    if (!isNil(cachedData)) {
      return cachedData;
    }

    const internalCreateValueFunc = this.buildInternalCreateValueFunc<T>(createValueFunc);
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
    const internalCreateValueFunc = this.buildInternalCreateValueFunc(createValueFunc);
    const value = await internalCreateValueFunc();
    if (!value) {
      return;
    }
    await this.set<T>(key, value, ttl);
    return value;
  }

  private buildInternalCreateValueFunc<T>(
    createValueFunc: () => T | Promise<T | undefined> | undefined,
  ): () => Promise<T | undefined> {
    return async () => {
      let data = createValueFunc();
      if (data instanceof Promise) {
        data = await data;
      }
      return data;
    };
  }
}
