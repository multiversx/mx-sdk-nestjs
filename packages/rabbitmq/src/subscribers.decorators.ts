import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { applyDecorators } from '@nestjs/common';
import { RabbitConsumerConfig } from './entities/consumer-config.interface';
import * as uuid from 'uuid';
// CHANGE HERE
import { MetricsService } from '@multiversx/sdk-nestjs-common';
import { CpuProfiler } from '@multiversx/sdk-nestjs-common';
import { PerformanceProfiler } from '@multiversx/sdk-nestjs-common';

function QueueMetricsConsumer(queue: string) {
  return (
    _target: Object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const childMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      MetricsService.setQueueConsume(queue, key as string);
      const cpuProfiler = new CpuProfiler();
      const performanceProfiler = new PerformanceProfiler();
      const data = await childMethod.apply(this, args);

      performanceProfiler.stop();
      MetricsService.setQueueHandlerCpu(queue, key as string, cpuProfiler.stop());
      MetricsService.setQueueHandlerDuration(queue, key as string, performanceProfiler.duration);
      return data;
    };
    return descriptor;
  };
}

/** Competing Consumer which will be handled by only one instance of the microservice.
 * Make sure the exchange exists.
*/
export const CompetingRabbitConsumer = (config: RabbitConsumerConfig) => {
  const { queue, exchange, disable } = config;

  if (disable) {
    return applyDecorators();
  }

  return applyDecorators(
    QueueMetricsConsumer(queue),
    RabbitSubscribe({
      queue,
      exchange,
      routingKey: '',
    })
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
    QueueMetricsConsumer(`${queue}_${uuid.v4()}`),
    RabbitSubscribe({
      queue: `${queue}_${uuid.v4()}`,
      exchange,
      routingKey: '',
      queueOptions: {
        autoDelete: true,
      },
    })
  );
};
