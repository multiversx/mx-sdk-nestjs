import { Logger } from "@nestjs/common";
import { Locker, LockResult } from "../utils/locker";

export interface LockAndRetryDelayOptions {
  duration: number;
  incrementDuration: number;
}

export interface LockAndRetryOptions {
  name?: string;
  verbose?: boolean;
  maxRetries?: number;
  delay?: LockAndRetryDelayOptions;
}

export function LockAndRetry(options?: LockAndRetryOptions) {
  return (_target: Object, _key: string | symbol, descriptor: PropertyDescriptor) => {
    const logger = new Logger(LockAndRetry.name);

    const childMethod = descriptor.value;

    const name = options?.name ?? childMethod.name;
    const verbose = options?.verbose ?? false;
    const maxRetries = options?.maxRetries ?? 3;
    const delay = options?.delay;

    descriptor.value = async function (...args: any[]) {
      const lockerName = args.length > 0
        ? `${name}: ${args.map(arg => JSON.stringify(arg)).join()}`
        : name;

      let result: LockResult = LockResult.ERROR;
      let retries = 0;
      let methodResult: any = undefined;

      while (result === LockResult.ERROR && retries < maxRetries) {
        if (result === LockResult.ERROR && retries > 0) {
          logger.log(`Retry #${retries} for '${lockerName}'`);

          if (delay) {
            const delayMs = delay.duration + (retries - 1) * delay.incrementDuration;

            logger.log(`Apply delay of ${delayMs}ms for '${lockerName}'`);

            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }

        result = await Locker.lock(
          lockerName,
          async () => {
            methodResult = await childMethod.apply(this, args);
          },
          verbose
        );

        retries++;
      }

      if (result === LockResult.SUCCESS) {
        return methodResult;
      }

      if (result === LockResult.ERROR) {
        throw new Error(`Could not execute '${lockerName}' after ${retries} retries`);
      }
    };
    return descriptor;
  };
}
