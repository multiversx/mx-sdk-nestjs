import { DecoratorUtils } from "@multiversx/sdk-nestjs-common/lib/utils/decorator.utils";

export class ScrollableOptions {
  collection: string = '';
}

export const Scrollable = DecoratorUtils.registerMethodDecorator(ScrollableOptions);
