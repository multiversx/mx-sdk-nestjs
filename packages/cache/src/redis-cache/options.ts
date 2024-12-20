import { ModuleMetadata } from '@nestjs/common';
import { ConnectionOptions } from 'tls';

export class RedisCacheModuleOptions {
  config: {
    host?: string | undefined;
    port?: number | undefined;
    username?: string | undefined;
    password?: string | undefined;
    sentinelUsername?: string | undefined;
    sentinelPassword?: string | undefined;
    sentinels?: Array<{ host: string; port: number }> | undefined;
    connectTimeout?: number | undefined;
    name?: string | undefined;
    tls?: ConnectionOptions | undefined;
    db?: number | undefined;
    enableAutoPipelining?: boolean | undefined;
    autoPipeliningIgnoredCommands?: string[] | undefined;
  };

  additionalOptions?: {
    poolLimit?: number | undefined;
    processTtl?: number | undefined;
  };

  constructor(
    options: RedisCacheModuleOptions['config'],
    additionalOptions?: RedisCacheModuleOptions['additionalOptions'],
  ) {
    this.config = {};
    this.additionalOptions = {};
    Object.assign(this.config, options);
    Object.assign(this.additionalOptions, additionalOptions);
  }
}

export interface RedisCacheModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<RedisCacheModuleOptions> | RedisCacheModuleOptions;
  inject?: any[];
}
