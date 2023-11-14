export class LockTimeoutError extends Error {
  constructor(lockKey: string) {
    super(`Timeout out while attempting to acquire lock for resource '${lockKey}'`);
  }
}
