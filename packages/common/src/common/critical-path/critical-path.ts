import { CriticalPathHandler } from "./critical-path.handler";

export function CriticalPath() {
  return (_target: Object, _key: string | symbol, descriptor: PropertyDescriptor) => {
    const childMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      await CriticalPathHandler.execute(async () => await childMethod.apply(this, args));
    };

    return descriptor;
  };
}
