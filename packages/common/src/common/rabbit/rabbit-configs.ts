export interface RabbitConsumerConfig {
  exchange: string;
  disable?: boolean;
  queue: string;
}

export interface RabbitModuleConfig {
  uri: string;
  exchanges?: string[] | undefined;
}
