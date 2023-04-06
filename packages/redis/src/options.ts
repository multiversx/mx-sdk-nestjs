import { RedisOptions } from 'ioredis';
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

export type RedisDefaultOptions = RedisOptions;

export interface RedisModuleOptions {
  config: RedisOptions;
}

export interface RedisModuleOptionsFactory {
  createRedisModuleOptions(): Promise<RedisModuleOptions> | RedisModuleOptions;
}

export interface RedisModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useClass?: Type<RedisModuleOptionsFactory>;
  useExisting?: Type<RedisModuleOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<RedisModuleOptions> | RedisModuleOptions;
}
