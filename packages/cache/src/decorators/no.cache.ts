import { DecoratorUtils } from "@multiversx/sdk-nestjs-common/src/utils/decorator.utils";

export class NoCacheOptions { }

export const NoCache = DecoratorUtils.registerMethodDecorator(NoCacheOptions);
