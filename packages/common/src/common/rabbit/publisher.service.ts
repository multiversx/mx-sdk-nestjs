import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { OriginLogger } from '../../utils/origin.logger';

@Injectable()
export class RabbitPublisherService {
  private readonly logger = new OriginLogger(RabbitPublisherService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
  ) { }

  /** Will publish the input to the exchange. */
  async publish(exchange: string, input: unknown): Promise<void> {
    try {
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
