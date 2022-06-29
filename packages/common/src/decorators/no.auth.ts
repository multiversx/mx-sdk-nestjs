import { DecoratorUtils } from "../utils/decorator.utils";

export class NoAuthOptions { }

export const NoAuth = DecoratorUtils.registerMethodDecorator(NoAuthOptions);