import { DecoratorUtils } from "../../utils/decorator.utils";

export class ApplyComplexityOptions {
  constructor(init?: Partial<ApplyComplexityOptions>) {
    Object.assign(this, init);
  }

  target: any;
}

export const ApplyComplexity = DecoratorUtils.registerMethodDecorator(ApplyComplexityOptions);
