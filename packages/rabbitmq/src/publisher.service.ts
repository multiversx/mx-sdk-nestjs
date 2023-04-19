import crypto from 'crypto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Constants, OriginLogger, SwappableSettingsService } from '@multiversx/sdk-nestjs-common';
import { MetricsService, PerformanceProfiler } from '@multiversx/sdk-nestjs-monitoring';
import { RABBIT_ADDITIONAL_OPTIONS } from './entities/constants';
import { OptionsInterface } from './entities/options.interface';


@Injectable()
export class RabbitPublisherService {
  private readonly logger = new OriginLogger(RabbitPublisherService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Optional() private readonly storageService?: SwappableSettingsService,
    @Optional() @Inject(RABBIT_ADDITIONAL_OPTIONS) private readonly options?: OptionsInterface,
  ) { }

  private generateDuplicateMessageKey(exchange: string, input: unknown): string {
    const inputStringify = typeof input === 'object' ? JSON.stringify(input) : input;
    const inputHex = crypto.createHash('sha256').update(inputStringify as string).digest('hex');
    return `duplicateCheck:${exchange}:${inputHex}`;
  }

  private async isExchangeDisabled(exchange: string): Promise<boolean> {
    const key = `${exchange}:disabled`;
    if (this.storageService) {
      const isDisabled = await this.storageService.get(key);
      return isDisabled === 'true';
    }

    return false;
  }

  private async checkForDuplicatedMessages(exchange: string, input: unknown, source?: string): Promise<void> {
    if (this.storageService && this.options?.checkForDuplicates) {
      const key = this.generateDuplicateMessageKey(exchange, input);
      const existsInStorage = await this.storageService.get(key);
      if (existsInStorage) {
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
        await this.storageService.set(key, '1', 'EX', ttl);
        profiler.stop();
        MetricsService.setRedisCommonDuration('SET', profiler.duration);
      }
    }
  }

  public async invalidateDuplicateMessageKey(exchange: string, input: unknown): Promise<void> {
    const key = this.generateDuplicateMessageKey(exchange, input);
    if (this.storageService) {
      await this.storageService.delete(key);
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
