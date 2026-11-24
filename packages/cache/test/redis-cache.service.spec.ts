import Redis from 'ioredis';
import { MetricsService } from '@multiversx/sdk-nestjs-monitoring';
import { RedisCacheService } from '../src/redis-cache/redis-cache.service';

describe('RedisCacheService', () => {
  let exec: jest.Mock;
  let commands: any[][];
  let redisCacheService: RedisCacheService;

  beforeEach(() => {
    commands = [];
    exec = jest.fn();

    const multi: any = {
      get: (...args: any[]) => { commands.push(['get', ...args]); return multi; },
      mget: (...args: any[]) => { commands.push(['mget', ...args]); return multi; },
      pttl: (...args: any[]) => { commands.push(['pttl', ...args]); return multi; },
      exec,
    };
    const redis = { multi: () => multi } as unknown as Redis;
    const metricsService = { setRedisDuration: jest.fn() } as unknown as MetricsService;

    redisCacheService = new RedisCacheService(redis, metricsService);
  });

  describe('getWithRemainingTtl', () => {
    it('should return the parsed value and the remaining ttl in seconds', async () => {
      exec.mockResolvedValue([[null, JSON.stringify({ a: 1 })], [null, 1500]]);

      const result = await redisCacheService.getWithRemainingTtl('key');

      expect(commands).toEqual([['get', 'key'], ['pttl', 'key']]);
      expect(result).toEqual({ value: { a: 1 }, remainingTtl: 1.5 });
    });

    it('should return an undefined remaining ttl when the key has no expiration', async () => {
      exec.mockResolvedValue([[null, JSON.stringify('value')], [null, -1]]);

      const result = await redisCacheService.getWithRemainingTtl('key');

      expect(result).toEqual({ value: 'value', remainingTtl: undefined });
    });

    it('should return undefined when the key is missing', async () => {
      exec.mockResolvedValue([[null, null], [null, -2]]);

      const result = await redisCacheService.getWithRemainingTtl('key');

      expect(result).toEqual({ value: undefined, remainingTtl: undefined });
    });

    it('should return undefined when redis fails', async () => {
      exec.mockRejectedValue(new Error('redis down'));

      const result = await redisCacheService.getWithRemainingTtl('key');

      expect(result).toEqual({ value: undefined, remainingTtl: undefined });
    });
  });

  describe('getManyWithRemainingTtl', () => {
    it('should return the parsed values and remaining ttls aligned with the keys', async () => {
      exec.mockResolvedValue([
        [null, [JSON.stringify('a'), null, JSON.stringify('c')]],
        [null, 1000],
        [null, -2],
        [null, -1],
      ]);

      const result = await redisCacheService.getManyWithRemainingTtl(['a', 'b', 'c']);

      expect(commands).toEqual([['mget', ['a', 'b', 'c']], ['pttl', 'a'], ['pttl', 'b'], ['pttl', 'c']]);
      expect(result).toEqual({ values: ['a', null, 'c'], remainingTtls: [1, undefined, undefined] });
    });

    it('should return all keys as missing when redis fails', async () => {
      exec.mockRejectedValue(new Error('redis down'));

      const result = await redisCacheService.getManyWithRemainingTtl(['a', 'b']);

      expect(result).toEqual({ values: [null, null], remainingTtls: [undefined, undefined] });
    });

    it('should not call redis for an empty key list', async () => {
      const result = await redisCacheService.getManyWithRemainingTtl([]);

      expect(exec).not.toHaveBeenCalled();
      expect(result).toEqual({ values: [], remainingTtls: [] });
    });
  });
});
