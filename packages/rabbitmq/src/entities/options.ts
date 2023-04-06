import { ConnectionInitOptions, RabbitMQExchangeConfig } from '@golevelup/nestjs-rabbitmq';

export class RabbitModuleOptions {
  uri: string = '';
  connectionInitOptions?: ConnectionInitOptions | undefined;
  exchanges?: RabbitMQExchangeConfig[] | undefined;
  prefetchCount?: number | undefined;

  constructor(
    uri: string,
    exchanges: string[] | undefined = undefined,
    connectionInitOptions: ConnectionInitOptions | undefined = undefined,
    prefetchCount?: number | undefined,
  ) {
    this.uri = uri;
    this.exchanges = this.getExchanges(exchanges);
    this.connectionInitOptions = connectionInitOptions;
    this.prefetchCount = prefetchCount;
  }

  private getExchanges(
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
