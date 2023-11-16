import { ConnectionOptions } from 'tls';

export class RedlockConnectionOptions {
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

  constructor(init?: Partial<RedlockConnectionOptions>) {
    Object.assign(this, init);
  }
}
