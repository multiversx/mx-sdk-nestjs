import { Inject, Logger } from "@nestjs/common";
import { LockerService } from "../common/locker/locker.service";
import { Locker } from "../utils/locker";

export interface LockOptions {
  name?: string;
  verbose?: boolean;
  redisLockOptions?: {
    keyPrefix: string;
    ttl: number;
    argsToKeyMapper?: (args: any[]) => string;
  };
}

/**
  * This decorator does not allow the execution of the decorated method if the same method is already running.
  *
  * If the `redisLockOptions` option is provided, the decorator will use the `LockerService` to check if the method is already running.
  */
export function Lock(options?: LockOptions) {
  const logger = new Logger('Lock');
  const lockerServiceInjector = options?.redisLockOptions ? Inject(LockerService) : undefined;

  return (target: Object, _key: string | symbol, descriptor: PropertyDescriptor) => {
    if (lockerServiceInjector) {
      lockerServiceInjector(target, 'lockerService');
    }

    const childMethod = descriptor.value;

    const lockerName = options?.name ?? childMethod.name;
    const verbose = options?.verbose ?? false;

    descriptor.value = async function (...args: any[]) {
      //@ts-ignore
      const lockerService: LockerService = this.lockerService;

      if (lockerService) {
        const stringifiedArgs = options?.redisLockOptions?.argsToKeyMapper
          ? options.redisLockOptions.argsToKeyMapper(args)
          : args.join(':');
        const lockerRedisKey = `${options?.redisLockOptions?.keyPrefix ?? 'locker'}:${stringifiedArgs}`;
        const lockerRedisTtl = options?.redisLockOptions?.ttl ?? 1;

        const isLockAcquired = await lockerService.isLockAcquired(lockerRedisKey, lockerRedisTtl);
        if (!isLockAcquired) {
          if (verbose) {
            logger.log(`${lockerName} is already running`);
          }
          return;
        }
      }

      await Locker.lock(
        lockerName,
        async () => await childMethod.apply(this, args),
        verbose
      );
    };
    return descriptor;
  };
}
