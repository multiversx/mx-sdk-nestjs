import { CacheService } from '../src/cache/cache.service';
import { InMemoryCacheService } from '../src/in-memory-cache/in-memory-cache.service';
import { RedisCacheService } from '../src/redis-cache/redis-cache.service';

describe('CacheService', () => {
  let inMemoryCacheService: InMemoryCacheService;
  let redisCacheService: jest.Mocked<Pick<RedisCacheService, 'getWithRemainingTtl' | 'getManyWithRemainingTtl' | 'set'>>;
  let cacheService: CacheService;

  beforeEach(() => {
    inMemoryCacheService = new InMemoryCacheService();
    redisCacheService = {
      getWithRemainingTtl: jest.fn(),
      getManyWithRemainingTtl: jest.fn(),
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
      redisCacheService.getWithRemainingTtl.mockResolvedValue({ value: { a: 1 }, remainingTtl: 1 });
      const setLocalSpy = jest.spyOn(inMemoryCacheService, 'set');
      const createValueFunc = jest.fn();

      const result = await cacheService.getOrSet(key, createValueFunc, 10);

      expect(result).toEqual({ a: 1 });
      expect(createValueFunc).not.toHaveBeenCalled();
      expect(setLocalSpy).toHaveBeenCalledWith(key, { a: 1 }, 1, true);
    });

    it('should cache locally for the in-memory ttl when the remaining redis ttl is higher', async () => {
      const key = 'key-high-remaining-ttl';
      redisCacheService.getWithRemainingTtl.mockResolvedValue({ value: 'value', remainingTtl: 60 });
      const setLocalSpy = jest.spyOn(inMemoryCacheService, 'set');

      await cacheService.getOrSet(key, jest.fn(), 30, 10);

      expect(setLocalSpy).toHaveBeenCalledWith(key, 'value', 10, true);
    });

    it('should cache locally for the in-memory ttl when the redis key has no expiration', async () => {
      const key = 'key-no-expiration';
      redisCacheService.getWithRemainingTtl.mockResolvedValue({ value: 'value', remainingTtl: undefined });
      const setLocalSpy = jest.spyOn(inMemoryCacheService, 'set');

      await cacheService.getOrSet(key, jest.fn(), 10);

      expect(setLocalSpy).toHaveBeenCalledWith(key, 'value', 10, true);
    });

    it('should create the value and set it in both caches when missing from redis', async () => {
      const key = 'key-missing';
      redisCacheService.getWithRemainingTtl.mockResolvedValue({ value: undefined, remainingTtl: undefined });
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
      expect(redisCacheService.getWithRemainingTtl).not.toHaveBeenCalled();
    });

    it('should create the value when redis returns nothing', async () => {
      const key = 'key-redis-error';
      redisCacheService.getWithRemainingTtl.mockResolvedValue({ value: undefined, remainingTtl: undefined });
      const createValueFunc = jest.fn().mockResolvedValue('created');

      const result = await cacheService.getOrSet(key, createValueFunc, 10);

      expect(result).toEqual('created');
      expect(createValueFunc).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshLocal', () => {
    it('should cache locally only for the remaining redis ttl when it is lower than the given ttl', async () => {
      const key = 'refresh-low-remaining-ttl';
      redisCacheService.getWithRemainingTtl.mockResolvedValue({ value: 'value', remainingTtl: 2 });
      const setLocalSpy = jest.spyOn(inMemoryCacheService, 'set');

      const result = await cacheService.refreshLocal(key, 10);

      expect(result).toEqual('value');
      expect(setLocalSpy).toHaveBeenCalledWith(key, 'value', 2, true);
    });

    it('should delete the local key when missing from redis', async () => {
      const key = 'refresh-missing';
      inMemoryCacheService.set(key, 'local', 10);
      redisCacheService.getWithRemainingTtl.mockResolvedValue({ value: undefined, remainingTtl: undefined });

      const result = await cacheService.refreshLocal(key, 10);

      expect(result).toBeUndefined();
      expect(inMemoryCacheService.get(key)).toBeUndefined();
    });
  });

  describe('batchGet', () => {
    it('should cache redis values locally for at most their remaining redis ttl', async () => {
      const setLocalSpy = jest.spyOn(inMemoryCacheService, 'set');
      const batchSetSpy = jest.spyOn(cacheService, 'batchSet').mockResolvedValue(undefined);
      redisCacheService.getManyWithRemainingTtl.mockResolvedValue({
        values: ['a-remote', 'b-remote', null],
        remainingTtls: [1, undefined, undefined],
      });
      const getter = jest.fn().mockResolvedValue({ 'batch-c': 'c-created' });

      const result = await cacheService.batchGet(['a', 'b', 'c'], element => `batch-${element}`, getter, 10);

      expect(result).toEqual({ 'batch-a': 'a-remote', 'batch-b': 'b-remote', 'batch-c': 'c-created' });
      expect(getter).toHaveBeenCalledWith(['c']);
      expect(setLocalSpy).toHaveBeenCalledWith('batch-a', 'a-remote', 1, true);
      expect(setLocalSpy).toHaveBeenCalledWith('batch-b', 'b-remote', 10, true);
      expect(batchSetSpy).toHaveBeenCalledWith(['batch-c'], ['c-created'], [10]);
    });

    it('should fall back to the getter when redis returns nothing', async () => {
      jest.spyOn(cacheService, 'batchSet').mockResolvedValue(undefined);
      redisCacheService.getManyWithRemainingTtl.mockResolvedValue({ values: [null], remainingTtls: [undefined] });
      const getter = jest.fn().mockResolvedValue({ 'batch-x': 'x-created' });

      const result = await cacheService.batchGet(['x'], element => `batch-${element}`, getter, 10);

      expect(result).toEqual({ 'batch-x': 'x-created' });
      expect(getter).toHaveBeenCalledWith(['x']);
    });
  });
});
