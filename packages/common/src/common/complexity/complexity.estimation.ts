import "reflect-metadata";
import { DecoratorUtils } from "../../utils/decorator.utils";

export class ComplexityEstimationOptions {
  group?: string;
  value?: number;
}

export function ComplexityEstimation(options?: ComplexityEstimationOptions) {
  return DecoratorUtils.registerPropertyDecorator(ComplexityEstimationOptions, options);
}