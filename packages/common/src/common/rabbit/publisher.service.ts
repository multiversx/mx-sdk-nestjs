import crypto from 'crypto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import Redis from 'ioredis';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Constants } from '../../utils/constants';
import { OriginLogger } from '../../utils/origin.logger';
import { InMemoryCacheService } from '../caching';
import { MetricsService } from '../metrics/metrics.service';
import { RABBIT_ADDITIONAL_OPTIONS } from './constants';
import { OptionsInterface } from './entities/options.interface';
import { PerformanceProfiler } from '../../utils/performance.profiler';
import { REDIS_CLIENT_TOKEN } from '../redis/entities/common.constants';
import { SwappableSettingsService } from '../swappable-settings';


@Injectable()
export class RabbitPublisherService {
  private readonly logger = new OriginLogger(RabbitPublisherService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Optional() @Inject(REDIS_CLIENT_TOKEN) private readonly redisService?: Redis,
    @Optional() private readonly inMemoryCacheService?: InMemoryCacheService,
    @Optional() private readonly swappableSettingsService?: SwappableSettingsService,
    @Optional() @Inject(RABBIT_ADDITIONAL_OPTIONS) private readonly options?: OptionsInterface,
  ) { }

  private generateDuplicateMessageKey(exchange: string, input: unknown): string {
    const inputStringify = typeof input === 'object' ? JSON.stringify(input) : input;
    const inputHex = crypto.createHash('sha256').update(inputStringify as string).digest('hex');
    return `duplicateCheck:${exchange}:${inputHex}`;
  }

  async isExchangeDisabled(exchange: string): Promise<boolean> {
    if (this.swappableSettingsService) {
      const data = await this.swappableSettingsService.get(`${exchange}:disabled`);
      return data === 'true';
    }
    return false;
  }

  async isAlreadySent(exchange: string, input: unknown, source?: string): Promise<boolean> {
    if (this.redisService && this.inMemoryCacheService && this.options?.checkForDuplicates) {
      const key = this.generateDuplicateMessageKey(exchange, input);
      const existsInMemory = await this.inMemoryCacheService.get(key);
      let exists = existsInMemory;
      if (!existsInMemory) {
        const profiler = new PerformanceProfiler();
        exists = await this.redisService.get(key);
        profiler.stop();
        MetricsService.setRedisCommonDuration('GET', profiler.duration);
      }

      if (exists) {
        MetricsService.setDuplicatedMessageDetected(exchange, source || '');
        if (this.options?.logsVerbose) {
          this.logger.warn('Duplicate message detected, not publishing to RabbitMq Exchange.', {
            exchange,
            input,
          });
        }
        return true;
      } else {
        const ttl = this.options.duplicatesCheckTtl || Constants.oneMinute();
        const profiler = new PerformanceProfiler();
        await this.redisService.set(key, '1', 'EX', ttl);
        profiler.stop();
        MetricsService.setRedisCommonDuration('SET', profiler.duration);
        this.inMemoryCacheService?.set(key, '1', ttl);
        return false;
      }
    }
    return false;
  }

  public async invalidateDuplicateMessageKey(exchange: string, input: unknown): Promise<void> {
    const key = this.generateDuplicateMessageKey(exchange, input);
    if (this.redisService) {
      await this.redisService.del(key);
    }
  }

  /** Will publish the input to the exchange. */
  async publish(exchange: string, input: unknown, source?: string): Promise<void> {
    try {
      const isDisabled = await this.isExchangeDisabled(exchange);
      if (isDisabled) {
        if (this.options?.logsVerbose) {
          this.logger.log(`Publishing to RabbitMq Exchange: ${exchange} is disabled`);
        }
        return;
      }

      const isAlreadySent = await this.isAlreadySent(exchange, input, source);
      if (!isAlreadySent) {

        if (this.options?.logsVerbose) {
          this.logger.log(`Publishing to RabbitMq Exchange: ${exchange}`, { input });
        }

        MetricsService.setQueuePublish(exchange, source || '');
        await this.amqpConnection.publish(exchange, '', input);
      }
    } catch (err) {
      this.logger.error('An error occurred while publishing to RabbitMq Exchange.', {
        exchange,
        input,
        error: err,
      });
    }
  }
}
