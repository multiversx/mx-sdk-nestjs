export function PassthroughAsync(enabled: boolean, returnedValue?: any) {
  return (
    _target: Object,
    _key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const childMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      if (enabled) return returnedValue;
      return await childMethod.apply(this, args);
    };
    return descriptor;
  };
}

export function PassthroughSync(enabled: boolean, returnedValue: any) {
  return (
    _target: Object,
    _key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const childMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      if (enabled) return returnedValue;
      return childMethod.apply(this, args);
    };
    return descriptor;
  };
}
