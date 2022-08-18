import "reflect-metadata";
import { DecoratorUtils } from "../../utils/decorator.utils";

export class ComplexityOptions {
  estimations?: { [field: string]: number | any };
}

export function Complexity(options?: ComplexityOptions) {
  return DecoratorUtils.registerClassDecorator(ComplexityOptions, options);
}
