import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { OriginLogger } from '../../utils/origin.logger';
import { MetricsService } from '../metrics/metrics.service';
import { RABBIT_ADDITIONAL_OPTIONS } from './constants';
import { OptionsInterface } from './entities/options.interface';

@Injectable()
export class RabbitPublisherService {
  private readonly logger = new OriginLogger(RabbitPublisherService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Optional() @Inject(RABBIT_ADDITIONAL_OPTIONS) private readonly options?: OptionsInterface,
  ) { }

  /** Will publish the input to the exchange. */
  async publish(exchange: string, input: unknown, source?: string): Promise<void> {
    try {
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
