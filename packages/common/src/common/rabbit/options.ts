import { RabbitMQExchangeConfig } from '@golevelup/nestjs-rabbitmq';

export class RabbitModuleOptions {
  uri: string = '';
  exchanges?: RabbitMQExchangeConfig[] | undefined;

  constructor(
    uri: string,
    exchanges: string[] | undefined = undefined,
  ) {
    this.uri = uri;
    this.exchanges = this.getExchanges(exchanges);
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
