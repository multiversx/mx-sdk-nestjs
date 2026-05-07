import { ShutdownAwareHandler } from "./shutdown-aware.handler";

export function ShutdownAware() {
  return (_target: Object, _key: string | symbol, descriptor: PropertyDescriptor) => {
    const childMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      await ShutdownAwareHandler.executeCriticalTask(async () => await childMethod.apply(this, args));
    };

    return descriptor;
  };
}
