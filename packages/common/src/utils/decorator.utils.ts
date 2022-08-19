import { Type } from "@nestjs/common";

export class DecoratorUtils {
  static registerMethodDecorator<T>(type: Type<T>): (options?: T) => MethodDecorator {
    return (options?: T): MethodDecorator => (_, __, descriptor: any) => {
      Reflect.defineMetadata(type.name, Object.assign(new type(), options), descriptor.value);
      return descriptor;
    };
  }

  static registerClassDecorator<T>(
    type: Type,
    metadata: T
  ): ClassDecorator {
    return (target) => {
      Reflect.defineMetadata(type.name, metadata, target);
      return target;
    };
  }

  static registerPropertyDecorator<T>(
    type: Type,
    metadata: T
  ): PropertyDecorator {
    return (target, key) => {
      let existingMetadata = Reflect.getMetadata(type.name, target.constructor);
      if (!existingMetadata) {
        existingMetadata = {};
      }

      existingMetadata[key] = metadata;

      Reflect.defineMetadata(type.name, existingMetadata, target.constructor);

      return target;
    };
  }

  static getMethodDecorator<T>(type: Type<T>, target: Function): T | undefined {
    const metadata = Reflect.getOwnMetadata(type.name, target);
    if (!metadata) {
      return undefined;
    }

    if (!(metadata instanceof type)) {
      return undefined;
    }

    return metadata;
  }

  static getClassDecorator<TClass, TResult>(type: Type<TResult>, target: Type<TClass>): TResult | undefined {
    return Reflect.getOwnMetadata(type.name, target);
  }

  static getPropertyDecorators<T>(type: Type<T>, target: Type): Record<string, T> {
    return Reflect.getMetadata(type.name, target);
  }
}
