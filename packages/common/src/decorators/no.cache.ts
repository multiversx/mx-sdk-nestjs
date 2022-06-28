import { DecoratorUtils } from "../utils/decorator.utils";

export class NoCacheOptions { }

export const NoCache = DecoratorUtils.registerMethodDecorator(NoCacheOptions);
