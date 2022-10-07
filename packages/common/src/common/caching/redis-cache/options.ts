import { ModuleMetadata } from '@nestjs/common';

export class RedisCacheModuleOptions {
  host: string = '';
  port: number = 0;
  username?: string | undefined;
  password?: string | undefined;
  sentinels?: Array<{ host: string; port: number }> | undefined;
  connectTimeout?: number | undefined;
  config = {
    url: '',
  };
}

export interface RedisCacheModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<RedisCacheModuleOptions> | RedisCacheModuleOptions;
  inject?: any[];
}
