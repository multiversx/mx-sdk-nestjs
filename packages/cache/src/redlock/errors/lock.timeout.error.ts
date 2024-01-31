export class LockTimeoutError extends Error {
  constructor(lockKey: string) {
    super(`Timed out while attempting to acquire lock for resource '${lockKey}'`);
  }
}
