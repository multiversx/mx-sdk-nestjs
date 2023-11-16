import Redis from 'ioredis';
import { Inject, Injectable } from '@nestjs/common';
import { MetricsService, PerformanceProfiler } from '@multiversx/sdk-nestjs-monitoring';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { RedlockConfiguration } from './redlock.configuration';
import { LockTimeoutError } from './errors/lock.timeout.error';
import { RedlockLogLevel } from './entities/redlock.log.level';

@Injectable()
export class RedlockService {
  private readonly logger = new OriginLogger(RedlockService.name);

  static logLevel: RedlockLogLevel = RedlockLogLevel.WARNING;

  constructor(
    @Inject('REDIS_CLIENTS') private readonly redisArray: Redis[],
    private readonly metricsService: MetricsService,
  ) { }

  async release(key: string): Promise<void> {
    const promise = async (redis: Redis) => await redis.del(key);
    await Promise.allSettled(this.redisArray.map(promise));
  }

  async lock(
    type: string,
    key: string,
    config: RedlockConfiguration,
  ): Promise<boolean> {
    const quorumSize = Math.floor(this.redisArray.length / 2) + 1;
    let successCount = 0;
    let settledCount = 0;

    return await new Promise<boolean>((resolve) => {
      const checkQuorum = () => {
        if (successCount >= quorumSize) {
          resolve(true);
        } else if (settledCount - successCount >= quorumSize) {
          // When it's impossible to reach quorum due to too many failures
          resolve(false);
        }
      };

      for (const redis of this.redisArray) {
        this.lockSingle(redis, type, key, config)
          .then(result => {
            if (result === true) {
              successCount++;
            }
            settledCount++;
            checkQuorum();
          })
          .catch(_ => {
            settledCount++;
            checkQuorum();
          });
      }
    });
  }

  async lockSingle(
    redis: Redis,
    type: string,
    key: string,
    config: RedlockConfiguration,
  ): Promise<boolean> {
    let retryTimes = 0;
    let result = false;
    const lockKey = `${type}:${key}`;

    const profiler = new PerformanceProfiler();

    do {
      result = await this.lockOnce(redis, lockKey, config.keyExpiration);
      if (result) {
        break;
      }

      retryTimes++;
      await this.sleep(config.retryInterval);
    } while (retryTimes <= config.maxRetries);

    if (retryTimes > 0 && result) {
      const duration = profiler.stop();

      this.logWarning(`Acquired lock for resource '${lockKey}' after ${retryTimes} retries and ${duration.toFixed(0)}ms with result ${result}`);
      this.metricsService.setRedlockAcquireDuration(type, duration);
    }

    if (!result) {
      this.metricsService.incrementRedlockFailure(type, 'ACQUIRE');
    }

    return result;
  }

  private async lockOnce(redis: Redis, key: string, keyExpiration: number): Promise<boolean> {
    // Using SET command with NX and PX options
    const result = await redis.set(key, '1', 'PX', keyExpiration, 'NX');

    // The SET command with NX returns null if the key already exists
    return result !== null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Number(ms)));
  }

  async using<T>(type: string, key: string, action: (signal: { aborted: boolean }) => Promise<T>, keyExpiration: number | RedlockConfiguration): Promise<T> {
    const lockKey = `${type}:${key}`;
    const configuration = this.getRedlockConfiguration(keyExpiration);

    const profiler = new PerformanceProfiler();

    const isLocked = await this.lock(type, key, configuration);
    if (!isLocked) {
      this.logError(`Timeout out while attempting to acquire lock for resource '${lockKey}'`);
      throw new LockTimeoutError(lockKey);
    }

    const signal = {
      aborted: false,
    };

    let extensionId: NodeJS.Timeout | undefined = undefined;
    applyExtension(this);

    try {
      return await action(signal);
    } finally {
      if (extensionId) {
        clearTimeout(extensionId);
      }

      await this.release(lockKey);

      const duration = profiler.stop();
      this.metricsService.setRedlockProcessDuration(type, duration);
    }

    function applyExtension(self: RedlockService, isFirstRun: boolean = true) {
      const waitTime = isFirstRun || !configuration.extendTtl ? Math.round(configuration.keyExpiration * 0.9) : Math.round((configuration.extendTtl ?? configuration.keyExpiration) * 0.9);

      extensionId = setTimeout(async () => {
        signal.aborted = true;

        const duration = profiler.stop();
        if (duration > configuration.keyExpiration * 10) {
          self.metricsService.incrementRedlockFailure(type, 'EXTEND_TIMEOUT');
          self.logError(`Stopped applying extension for resource '${lockKey}' since it was held for ${duration.toFixed(0)}ms`);
          return;
        }

        self.metricsService.incrementRedlockFailure(type, 'EXTEND');
        self.logWarning(`Applying extension for resource '${lockKey}'`);
        applyExtension(self, false);
        await self.extend(lockKey, configuration.extendTtl ?? configuration.keyExpiration);
      }, waitTime);
    }
  }

  async extend(key: string, expiration: number) {
    const promise = async (redis: Redis) => await redis.pexpire(key, expiration);

    await Promise.allSettled(this.redisArray.map(promise));
  }

  private getRedlockConfiguration(keyExpiration: number | RedlockConfiguration): RedlockConfiguration {
    if (typeof keyExpiration === 'number') {
      return {
        keyExpiration: keyExpiration,
        maxRetries: 100,
        retryInterval: Math.round(keyExpiration / 100),
      };
    }

    return keyExpiration;
  }

  private logWarning(message: string): void {
    if (RedlockService.logLevel === RedlockLogLevel.WARNING) {
      this.logger.warn(message);
    }
  }


  private logError(message: string): void {
    if ([RedlockLogLevel.WARNING, RedlockLogLevel.ERROR].includes(RedlockService.logLevel)) {
      this.logger.error(message);
    }
  }
}
