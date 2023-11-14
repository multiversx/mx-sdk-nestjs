import Redis from 'ioredis';
import { Inject, Injectable } from '@nestjs/common';
import { MetricsService, PerformanceProfiler } from '@multiversx/sdk-nestjs-monitoring';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { REDIS_CLIENT_TOKEN } from '@multiversx/sdk-nestjs-redis';
import { RedlockConfiguration } from './redlock.configuration';
import { LockTimeoutError } from './errors/lock.timeout.error';
import { RedlockLogLevel } from './entities/redlock.log.level';

@Injectable()
export class RedlockService {
  private readonly logger = new OriginLogger(RedlockService.name);

  static logLevel: RedlockLogLevel = RedlockLogLevel.WARNING;

  constructor(
    @Inject(REDIS_CLIENT_TOKEN) private readonly redis: Redis,
    private readonly metricsService: MetricsService,
  ) { }

  async release(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async lock(
    type: string,
    key: string,
    config: RedlockConfiguration,
  ): Promise<boolean> {
    let retryTimes = 0;
    let result = false;
    const lockKey = `${type}:${key}`;

    const profiler = new PerformanceProfiler();

    do {
      result = await this.lockOnce(lockKey, config.keyExpiration);
      if (result) {
        break;
      }

      retryTimes++;
      await this.sleep(config.retryInterval);
    } while (retryTimes <= config.maxRetries);

    if (retryTimes > 0) {
      const duration = profiler.stop();

      this.logWarning(`Acquired lock for resource '${lockKey}' after ${retryTimes} retries and ${duration.toFixed(0)}ms`);
      this.metricsService.setRedlockAcquireDuration(type, duration);
    }

    if (!result) {
      this.metricsService.incrementRedlockFailure(type, 'ACQUIRE');
    }

    return result;
  }

  private async lockOnce(key: string, keyExpiration: number): Promise<boolean> {
    // Using SET command with NX and PX options
    const result = await this.redis.set(key, '1', 'PX', keyExpiration, 'NX');

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
        await self.redis.pexpire(lockKey, configuration.extendTtl ?? configuration.keyExpiration);
        applyExtension(self, false);
        self.metricsService.incrementRedlockFailure(type, 'EXTEND');
        self.logWarning(`Applying extension for resource '${lockKey}'`);
      }, waitTime);
    }
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
