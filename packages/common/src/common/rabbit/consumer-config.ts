export interface RabbitConsumerConfig {
  exchange: string;
  disable?: boolean;
  queue: string;
}
