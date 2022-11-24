import { Locker } from "../utils/locker";

export interface LockOptions {
  name?: string;
  verbose?: boolean;
}

export function Lock(options?: LockOptions) {
  return (_target: Object, _key: string | symbol, descriptor: PropertyDescriptor) => {
    const childMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const lockerName = options?.name ?? childMethod.name;
      const verbose = options?.verbose ?? false;

      await Locker.lock(
        lockerName,
        async () => await childMethod.apply(this, args),
        verbose
      );
    };
    return descriptor;
  };
}
