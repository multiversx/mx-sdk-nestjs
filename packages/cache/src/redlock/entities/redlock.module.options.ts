import { ConnectionOptions } from 'tls';

export class RedlockModuleOptions {
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
  };

  additionalOptions?: {
    poolLimit?: number | undefined;
    processTtl?: number | undefined;
  };

  constructor(
    options: RedlockModuleOptions['config'],
    additionalOptions?: RedlockModuleOptions['additionalOptions'],
  ) {
    this.config = {};
    this.additionalOptions = {};
    Object.assign(this.config, options);
    Object.assign(this.additionalOptions, additionalOptions);
  }
}
