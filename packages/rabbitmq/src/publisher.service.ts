import crypto from 'crypto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import Redis from 'ioredis';
import { Inject, Injectable, Optional } from '@nestjs/common';
// CHANGE HERE
import { Constants } from '@multiversx/sdk-nestjs-common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { InMemoryCacheService } from '@multiversx/sdk-nestjs-cache';
import { MetricsService } from '@multiversx/sdk-nestjs-common';
import { RABBIT_ADDITIONAL_OPTIONS } from './entities/constants';
import { OptionsInterface } from './entities/options.interface';
import { PerformanceProfiler } from '@multiversx/sdk-nestjs-common';
import { SwappableSettingsService, SWAPPABLE_SETTINGS_REDIS_CLIENT } from '@multiversx/sdk-nestjs-common';


@Injectable()
export class RabbitPublisherService {
  private readonly logger = new OriginLogger(RabbitPublisherService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Optional() @Inject(SWAPPABLE_SETTINGS_REDIS_CLIENT) private readonly redisService?: Redis,
    @Optional() private readonly inMemoryCacheService?: InMemoryCacheService,
    @Optional() private readonly swappableSettingsService?: SwappableSettingsService,
    @Optional() @Inject(RABBIT_ADDITIONAL_OPTIONS) private readonly options?: OptionsInterface,
  ) { }

  private generateDuplicateMessageKey(exchange: string, input: unknown): string {
    const inputStringify = typeof input === 'object' ? JSON.stringify(input) : input;
    const inputHex = crypto.createHash('sha256').update(inputStringify as string).digest('hex');
    return `duplicateCheck:${exchange}:${inputHex}`;
  }

  private async isExchangeDisabled(exchange: string): Promise<boolean> {
    const key = `${exchange}:disabled`;
    if (this.swappableSettingsService && this.inMemoryCacheService) {
      const valueFromMemory = await this.inMemoryCacheService.get(key);
      if (valueFromMemory) {
        return valueFromMemory === 'true';
      }
      const data = await this.swappableSettingsService.get(key);
      this.inMemoryCacheService.set(key, data, Constants.oneSecond() * 10);
      return data === 'true';
    }

    return false;
  }

  private async checkForDuplicatedMessages(exchange: string, input: unknown, source?: string): Promise<void> {
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
      } else {
        const ttl = this.options.duplicatesCheckTtl || Constants.oneMinute();
        const profiler = new PerformanceProfiler();
        await this.redisService.set(key, '1', 'EX', ttl);
        profiler.stop();
        MetricsService.setRedisCommonDuration('SET', profiler.duration);
        this.inMemoryCacheService?.set(key, '1', ttl);
      }
    }
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

      await this.checkForDuplicatedMessages(exchange, input, source);

      if (this.options?.logsVerbose) {
        this.logger.log(`Publishing to RabbitMq Exchange: ${exchange}`, { input });
      }

      MetricsService.setQueuePublish(exchange, source || '');
      await this.amqpConnection.publish(exchange, '', input);

    } catch (err) {
      this.logger.error('An error occurred while publishing to RabbitMq Exchange.', {
        exchange,
        input,
        error: err,
      });
    }
  }
}
