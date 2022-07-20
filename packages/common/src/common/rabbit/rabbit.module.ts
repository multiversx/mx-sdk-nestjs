import { RabbitMQExchangeConfig, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { RabbitModuleConfig } from './rabbit-configs';
import { RabbitPublisherService } from './rabbit.publisher';

@Module({})
export class RabbitModule {
  static register(config: RabbitModuleConfig): DynamicModule {
    return {
      module: RabbitModule,
      imports: [
        RabbitMQModule.forRoot(RabbitMQModule, {
          uri: config.uri,
          exchanges: this.getExchanges(config.exchanges),
        }),
      ],
      providers: [RabbitPublisherService],
      exports: [RabbitPublisherService],
    };
  }

  private static getExchanges(
    exchanges: string[] | undefined,
  ): RabbitMQExchangeConfig[] | undefined {
    if (!exchanges) {
      return;
    }

    return exchanges.map(exchange => {
      return {
        name: exchange,
        type: 'fanout',
        options: {},
      };
    });
  }
}
