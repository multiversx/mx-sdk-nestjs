import { ModuleMetadata } from '@nestjs/common';

export class RedisCacheModuleOptions {
  config: {
    url: string,
  };

  constructor(
    host: string,
    port: number
  ) {
    this.config = {
      url: `redis://${host}:${port}`,
    };
  }
}

export interface RedisCacheModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<RedisCacheModuleOptions> | RedisCacheModuleOptions;
  inject?: any[];
}
