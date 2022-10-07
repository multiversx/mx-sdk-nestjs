import { ModuleMetadata } from '@nestjs/common';

export class RedisCacheModuleOptions {
  host?: string | undefined;
  port?: number | undefined;
  username?: string | undefined;
  password?: string | undefined;
  sentinelUsername?: string | undefined;
  sentinelPassword?: string | undefined;
  sentinels?: Array<{ host: string; port: number }> | undefined;
  connectTimeout?: number | undefined;
  config: {
    url: string,
  };

  constructor(
    options: Omit<RedisCacheModuleOptions, 'config'>,
  ) {
    this.host = options.host;
    this.port = options.port;
    this.username = options.username;
    this.password = options.password;
    this.sentinelUsername = options.sentinelUsername;
    this.sentinelPassword = options.sentinelPassword;
    this.sentinels = options.sentinels;
    this.connectTimeout = options.connectTimeout;
    this.config = {
      url: '',
    };
  }
}

export interface RedisCacheModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<RedisCacheModuleOptions> | RedisCacheModuleOptions;
  inject?: any[];
}
