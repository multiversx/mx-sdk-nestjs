import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { applyDecorators } from '@nestjs/common';
import { RabbitConsumerConfig } from './consumer-config';
import * as uuid from 'uuid';

/** Competing Consumer which will be handled by only one instance of the microservice.
 * Make sure the exchange exists.
*/
export const CompetingRabbitConsumer = (config: RabbitConsumerConfig) => {
  const { queue, exchange, disable } = config;

  if (disable) {
    return applyDecorators();
  }

  return applyDecorators(
    RabbitSubscribe({
      queue,
      exchange,
      routingKey: '',
      queueOptions: {
        messageTtl: 100,
      },
    }),
  );
};

/** Public Consumer which will be handled by all instances of the microservice.
 * Make sure the exchange exists.
*/
export const PublicRabbitConsumer = (config: RabbitConsumerConfig) => {
  const { queue, exchange, disable } = config;

  if (disable) {
    return applyDecorators();
  }

  return applyDecorators(
    RabbitSubscribe({
      queue: `${queue}_${uuid.v4()}`,
      exchange,
      routingKey: '',
      queueOptions: {
        autoDelete: true,
      },
    }),
  );
};
