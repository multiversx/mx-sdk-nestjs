import Redis from 'ioredis';
import { Inject, Injectable } from '@nestjs/common';
import { MetricsService, PerformanceProfiler } from '@multiversx/sdk-nestjs-monitoring';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { REDIS_CLIENT_TOKEN } from '@multiversx/sdk-nestjs-redis';
import { promisify } from 'util';

@Injectable()
export class RedisCacheService {
  private readonly logger = new OriginLogger(RedisCacheService.name);

  constructor(
    @Inject(REDIS_CLIENT_TOKEN) private readonly redis: Redis,
    private readonly metricsService: MetricsService,
  ) { }

  async get<T>(
    key: string,
  ): Promise<T | undefined> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      const data = await this.redis.get(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('RedisCache - An error occurred while trying to get from redis cache.', {
          cacheKey: key,
          error: error?.toString(),
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('GET', performanceProfiler.duration);
    }
    return undefined;
  }

  async getMany<T>(
    keys: string[],
  ): Promise<(T | undefined | null)[]> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      const items = await this.redis.mget(keys);
      const values = items.map(item => item ? JSON.parse(item) as T : null);
      return values;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to get many keys from redis cache.',
          {
            cacheKeys: keys,
            exception: error?.toString(),
          });
      }
      return [];
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('MGET', performanceProfiler.duration);
    }
  }

  async setnx<T>(
    key: string,
    value: T,
    cacheNullable: boolean = true,
  ): Promise<boolean> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      if (!cacheNullable && value == null) {
        return false;
      }

      const result = await this.redis.setnx(key, JSON.stringify(value));
      return result === 1;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('SETNX', performanceProfiler.duration);
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number | null = null,
    cacheNullable: boolean = true,
  ): Promise<void> {
    if (value === undefined) {
      return;
    }

    if (!cacheNullable && value == null) {
      return;
    }

    if (typeof ttl === 'number' && ttl <= 0) {
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
          cacheKey: key,
          error: error?.toString(),
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
    cacheNullable: boolean = true,
  ): Promise<void> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      let commands = [];
      if (!cacheNullable) {
        commands = keys.map((key, index) => {
          if (values[index] == null) {
            return [];
          }
          return ['set', key, JSON.stringify(values[index]), 'EX', ttl.toString()];
        });

        commands = commands.filter(command => command.length !== 0);
      } else {
        commands = keys.map((key, index) => {
          return ['set', key, JSON.stringify(values[index]), 'EX', ttl.toString()];
        });
      }
      await this.asyncMulti(commands);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('RedisCache - An error occurred while trying to set many in redis cache.', {
          cacheKey: keys,
          error: error?.toString(),
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

  async pexpire(
    key: string,
    ttl: number,
  ): Promise<void> {
    await this.redis.pexpire(key, ttl);
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
          cacheKey: key,
          error: error?.toString(),
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

  async deleteByPattern(keyPattern: string): Promise<void> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      const stream = this.redis.scanStream({
        match: keyPattern,
        count: 10,
      });
      const dels: [][] = await new Promise((resolve, reject) => {
        let delKeys: [][] = [];
        stream.on('data', function (resultKeys) {
          delKeys = [...delKeys, ...resultKeys.map((key: string) => ['del', key])];
        });
        stream.on('end', () => {
          resolve(delKeys);
        });
        stream.on('error', (err) => {
          reject(err);
        });
      });

      await this.asyncMulti(dels);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to delete from redis cache by pattern.', {
          error: error?.toString(),
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('MDEL', performanceProfiler.duration);
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
    createValueFunc: () => Promise<T>,
    ttl: number,
    cacheNullable: boolean = true,
  ): Promise<T> {
    const cachedData = await this.get<T>(key);
    if (cachedData !== undefined) {
      return cachedData;
    }

    const internalCreateValueFunc = this.buildInternalCreateValueFunc<T>(key, createValueFunc);
    const value = await internalCreateValueFunc();
    await this.set<T>(key, value, ttl, cacheNullable);
    return value;
  }

  async setOrUpdate<T>(
    key: string,
    createValueFunc: () => Promise<T>,
    ttl: number,
    cacheNullable: boolean = true,
  ): Promise<T> {
    const internalCreateValueFunc = this.buildInternalCreateValueFunc<T>(key, createValueFunc);
    const value = await internalCreateValueFunc();
    await this.set<T>(key, value, ttl, cacheNullable);
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
          cacheKey: key,
          error: error?.toString(),
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('INCR', performanceProfiler.duration);
    }
  }

  async incrby(
    key: string,
    value: number | string,
  ): Promise<number> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.incrby(key, value);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('RedisCache - An error occurred while trying to incrby redis key.', {
          cacheKey: key,
          error: error?.toString(),
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('INCRBY', performanceProfiler.duration);
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
          cacheKey: key,
          error: error?.toString(),
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('DECR', performanceProfiler.duration);
    }
  }

  async hget<T>(
    hash: string,
    field: string,
  ): Promise<T | null> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      const data = await this.redis.hget(hash, field);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to hget from redis.', {
          hash, field,
          exception: error?.toString(),
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('HGET', performanceProfiler.duration);
    }
    return null;
  }

  async hgetall<T>(
    hash: string,
  ): Promise<Record<string, T> | null> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      const data = await this.redis.hgetall(hash);
      if (!data) {
        return null;
      }

      const response: Record<string, T> = {};
      for (const key of Object.keys(data)) {
        response[key] = JSON.parse(data[key]);
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to hgetall from redis.', {
          hash,
          exception: error?.toString(),
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('HGETALL', performanceProfiler.duration);
    }
    return null;
  }

  async hset<T>(
    hash: string,
    field: string,
    value: T,
    cacheNullable: boolean = true,
  ): Promise<number> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      if (!cacheNullable && value == null) {
        return 0;
      }
      return await this.redis.hset(hash, field, JSON.stringify(value));
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to hset in redis.', {
          hash, field, value,
          exception: error?.toString(),
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('HSET', performanceProfiler.duration);
    }
  }

  async hincrby(
    hash: string,
    field: string,
    value: number | string,
  ): Promise<number> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.hincrby(hash, field, value);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to hincrby in redis.', {
          hash, field, value,
          exception: error?.toString(),
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('HINCRBY', performanceProfiler.duration);
    }
  }

  async hkeys(
    hash: string,
  ): Promise<string[]> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.hkeys(hash);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to hkeys in redis.', {
          hash,
          exception: error?.toString(),
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('HKEYS', performanceProfiler.duration);
    }
  }

  async zadd(
    key: string,
    member: string,
    value: number,
    options: string[] = [],
  ): Promise<string | number> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.zadd(key, ...options, value, member);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to zadd in redis.', {
          exception: error?.toString(),
          key,
          member,
          value,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('ZADD', performanceProfiler.duration);
    }
  }

  async zincrby(
    key: string,
    member: string,
    increment: number,
  ): Promise<string> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.zincrby(key, increment, member);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to zincrby in redis.', {
          exception: error?.toString(),
          key,
          member,
          increment,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('ZINCRBY', performanceProfiler.duration);
    }
  }

  async zrank(
    key: string,
    member: string,
  ): Promise<number | null> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.zrank(key, member);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to get zrank from redis.', {
          exception: error?.toString(),
          key,
          member,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('ZRANK', performanceProfiler.duration);
    }
  }


  async keys(
    key: string,
  ): Promise<string[]> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.keys(key);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to get keys from redis.', {
          exception: error?.toString(),
          key,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('KEYS', performanceProfiler.duration);
    }
  }

  async zrevrank(
    key: string,
    member: string,
  ): Promise<number | null> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.zrevrank(key, member);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to get zrevrank from redis.', {
          exception: error?.toString(),
          key,
          member,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('ZREVRANK', performanceProfiler.duration);
    }
  }

  async sadd(
    key: string,
    ...values: string[]
  ): Promise<number | null> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.sadd(key, ...values);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to sadd redis.', {
          exception: error?.toString(),
          key,
          ...values,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('SADD', performanceProfiler.duration);
    }
  }

  async sunionstore(
    destination: string,
    keys: string[],
  ): Promise<number> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.sunionstore(destination, keys);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to sunionstore in redis.', {
          destination, keys,
          exception: error?.toString(),
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('SUNIONSTORE', performanceProfiler.duration);
    }
  }

  async smembers(
    key: string,
  ): Promise<string[]> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to smembers in redis.', {
          exception: error?.toString(),
          key,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('SMEMBERS', performanceProfiler.duration);
    }
  }

  /**
   * @deprecated As of Redis version 6.2.0, this command is regarded as deprecated. It can be replaced by ZRANGE with the REV argument when migrating or writing new code.
   */
  async zrevrange(
    setName: string,
    start: number,
    stop: number,
    withScores: boolean = false,
  ): Promise<string[]> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      if (withScores) {
        return await this.redis.zrevrange(setName, start, stop, 'WITHSCORES');
      }
      return await this.redis.zrevrange(setName, start, stop);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to zrevrange in redis.', {
          exception: error?.toString(),
          setName,
          start,
          stop,
          withScores,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('ZREVRANGE', performanceProfiler.duration);
    }
  }

  async zrangebyscore(
    setName: string,
    start: number | string,
    stop: number | string,
    options?: {
      withScores?: boolean,
    },
  ): Promise<string[]> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      if (options?.withScores) {
        return await this.redis.zrangebyscore(setName, start, stop, 'WITHSCORES');
      }

      return await this.redis.zrangebyscore(setName, start, stop);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to get zrangebyscore in redis.', {
          exception: error?.toString(),
          setName,
          start,
          stop,
          options,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('ZRANGEBYSCORE', performanceProfiler.duration);
    }
  }

  async zrange(
    setName: string,
    start: number | string,
    stop: number | string,
    options?: {
      order?: 'REV' | undefined,
      withScores?: boolean,
    },
  ): Promise<string[]> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      if (options?.order === 'REV') {
        if (options?.withScores) {
          return await this.redis.zrange(setName, start, stop, 'REV', 'WITHSCORES');
        }
        return await this.redis.zrange(setName, start, stop, 'REV');
      }

      if (options?.withScores) {
        return await this.redis.zrange(setName, start, stop, 'WITHSCORES');
      }

      return await this.redis.zrange(setName, start, stop);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to get zrange in redis.', {
          exception: error?.toString(),
          setName,
          start,
          stop,
          options,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('ZRANGE', performanceProfiler.duration);
    }
  }

  async zmscore(
    setName: string,
    ...args: string[]
  ): Promise<(string | null)[]> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.zmscore(setName, args);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to zmscore in redis.', {
          exception: error?.toString(),
          setName,
          args,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('ZMSCORE', performanceProfiler.duration);
    }
  }

  async scard(
    key: string,
  ): Promise<number> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.scard(key);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to scard in redis.', {
          exception: error?.toString(),
          key,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('SCARD', performanceProfiler.duration);
    }
  }

  async zcount(
    key: string,
    min: number | '-inf',
    max: number | '+inf',
  ): Promise<number> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.zcount(key, min, max);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to get zcount in redis.', {
          exception: error?.toString(),
          key,
          min,
          max,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('ZCOUNT', performanceProfiler.duration);
    }
  }

  public defineCommand(
    name: string,
    definition: {
      lua: string;
      numberOfKeys?: number;
      readOnly?: boolean;
    },
  ): void {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return this.redis.defineCommand(name, definition);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to define command in redis.', {
          exception: error?.toString(),
          name,
          definition,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('DEFINECOMMAND', performanceProfiler.duration);
    }
  }

  public async executeCommand(name: string, ...args: (string | Buffer | number)[]): Promise<unknown> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      // @ts-ignore
      return await this.redis[name](args);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to execute custom command in redis.', {
          exception: error?.toString(),
          name,
          args,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration(name, performanceProfiler.duration);
    }
  }

  async rpush(key: string, items: any): Promise<void> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      if (items?.length > 0) {
        await this.redis.rpush(key, items);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to rpush to redis.', {
          exception: error?.toString(),
          key,
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('RPUSH', performanceProfiler.duration);
    }
  }

  /**
   * Wrapper over Redis List range operation.
   *
   * @param {string} key - The key where the list is stored.
   * @param {number} start - The offset of the first element to be returned. 0 means the first.
   * @param {number} stop - The offset of the last element to be returned. -1 means the last.
   * @returns The list values from the starting point to the stop point.
   */
  async lrange(key: string, start: number = 0, stop: number = -1): Promise<string[]> {
    const performanceProfiler = new PerformanceProfiler();
    try {
      return await this.redis.lrange(key, start, stop);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to execute lrange into redis.', {
          exception: error?.toString(),
          key,
        });
      }
      throw error;
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('LRANGE', performanceProfiler.duration);
    }
  }

  async lpop(key: string): Promise<string[]> {
    const performanceProfiler = new PerformanceProfiler();
    const items: string[] = [];
    try {
      let item: string | null;
      while (item = await this.redis.lpop(key)) {
        items.push(item);
      }
    } catch (error) {

      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to lpop to redis.', {
          exception: error?.toString(),
          key,
        });
      }
    } finally {
      performanceProfiler.stop();
      this.metricsService.setRedisDuration('LPOP', performanceProfiler.duration);
    }
    return items;
  }

  private buildInternalCreateValueFunc<T>(
    key: string,
    createValueFunc: () => Promise<T>,
  ): () => Promise<T> {
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
        throw error;
      }
    };
  }

  asyncMulti = async (commands: any[]) => {
    const profiler = new PerformanceProfiler();
    const multi = this.redis.multi(commands);
    const data = await promisify(multi.exec).call(multi);
    this.metricsService.setRedisDuration('MULTI', profiler.duration);
    return data;
  };

}
