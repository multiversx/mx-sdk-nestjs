import { CacheService } from '../src/cache/cache.service';
import { InMemoryCacheService } from '../src/in-memory-cache/in-memory-cache.service';
import { RedisCacheService } from '../src/redis-cache/redis-cache.service';

describe('CacheService', () => {
  let inMemoryCacheService: InMemoryCacheService;
  let redisCacheService: jest.Mocked<Pick<RedisCacheService, 'asyncMulti' | 'set'>>;
  let cacheService: CacheService;

  beforeEach(() => {
    inMemoryCacheService = new InMemoryCacheService();
    redisCacheService = {
      asyncMulti: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
    };
    cacheService = new CacheService(
      undefined as any,
      inMemoryCacheService,
      redisCacheService as unknown as RedisCacheService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getOrSet', () => {
    it('should cache locally only for the remaining redis ttl when it is lower than the in-memory ttl', async () => {
      const key = 'key-low-remaining-ttl';
      redisCacheService.asyncMulti.mockResolvedValue([[null, JSON.stringify({ a: 1 })], [null, 1000]]);
      const setLocalSpy = jest.spyOn(inMemoryCacheService, 'set');
      const createValueFunc = jest.fn();

      const result = await cacheService.getOrSet(key, createValueFunc, 10);

      expect(result).toEqual({ a: 1 });
      expect(createValueFunc).not.toHaveBeenCalled();
      expect(setLocalSpy).toHaveBeenCalledWith(key, { a: 1 }, 1, true);
    });

    it('should cache locally for the in-memory ttl when the remaining redis ttl is higher', async () => {
      const key = 'key-high-remaining-ttl';
      redisCacheService.asyncMulti.mockResolvedValue([[null, JSON.stringify('value')], [null, 60000]]);
      const setLocalSpy = jest.spyOn(inMemoryCacheService, 'set');

      await cacheService.getOrSet(key, jest.fn(), 30, 10);

      expect(setLocalSpy).toHaveBeenCalledWith(key, 'value', 10, true);
    });

    it('should cache locally for the in-memory ttl when the redis key has no expiration', async () => {
      const key = 'key-no-expiration';
      redisCacheService.asyncMulti.mockResolvedValue([[null, JSON.stringify('value')], [null, -1]]);
      const setLocalSpy = jest.spyOn(inMemoryCacheService, 'set');

      await cacheService.getOrSet(key, jest.fn(), 10);

      expect(setLocalSpy).toHaveBeenCalledWith(key, 'value', 10, true);
    });

    it('should create the value and set it in both caches when missing from redis', async () => {
      const key = 'key-missing';
      redisCacheService.asyncMulti.mockResolvedValue([[null, null], [null, -2]]);
      const setLocalSpy = jest.spyOn(inMemoryCacheService, 'set');
      const createValueFunc = jest.fn().mockResolvedValue('created');

      const result = await cacheService.getOrSet(key, createValueFunc, 10, 5);

      expect(result).toEqual('created');
      expect(createValueFunc).toHaveBeenCalledTimes(1);
      expect(redisCacheService.set).toHaveBeenCalledWith(key, 'created', 10, true);
      expect(setLocalSpy).toHaveBeenCalledWith(key, 'created', 5, true);
    });

    it('should return the local value without calling redis', async () => {
      const key = 'key-local';
      inMemoryCacheService.set(key, 'local', 10);

      const result = await cacheService.getOrSet(key, jest.fn(), 10);

      expect(result).toEqual('local');
      expect(redisCacheService.asyncMulti).not.toHaveBeenCalled();
    });

    it('should fall back to creating the value when redis fails', async () => {
      const key = 'key-redis-error';
      redisCacheService.asyncMulti.mockRejectedValue(new Error('redis down'));
      const createValueFunc = jest.fn().mockResolvedValue('created');

      const result = await cacheService.getOrSet(key, createValueFunc, 10);

      expect(result).toEqual('created');
      expect(createValueFunc).toHaveBeenCalledTimes(1);
    });
  });
});
