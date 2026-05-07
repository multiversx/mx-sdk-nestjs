import { OriginLogger } from "../utils/origin.logger";

interface IErrorLoggerOptions {
  logArgs: boolean;
}

const logger = new OriginLogger('Logger Decorator');

const getErrorText = (methodName: string, options?: IErrorLoggerOptions, ...args: any[]) => {
  const defaultText = `An unexpected error occurred when executing '${methodName}'`;

  if (options?.logArgs)
    return `${defaultText} with args ${args.join(',')}`;

  return defaultText;
};

export function ErrorLoggerSync(options?: IErrorLoggerOptions) {
  return (
    _target: Object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const childMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      try {
        //@ts-ignore
        return childMethod.apply(this, args);
      } catch (error) {
        logger.error(getErrorText(String(key), options, ...args));
        logger.error(error);
        throw error;
      }
    };
    return descriptor;
  };
}

export function ErrorLoggerAsync(options?: IErrorLoggerOptions) {
  return (
    _target: Object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const childMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        //@ts-ignore
        return await childMethod.apply(this, args);
      } catch (error) {
        logger.error(getErrorText(String(key), options, ...args));
        logger.error(error);
        throw error;
      }
    };
    return descriptor;
  };
}
