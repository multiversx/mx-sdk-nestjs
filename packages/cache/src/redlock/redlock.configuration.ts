export interface RedlockConfiguration {
  keyExpiration: number;
  maxRetries: number;
  retryInterval: number;
  extendTtl?: number;
}
