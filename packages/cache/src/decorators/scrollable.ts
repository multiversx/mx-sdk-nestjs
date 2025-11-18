import { DecoratorUtils } from "@multiversx/sdk-nestjs-common";

export class ScrollableOptions {
    collection: string = '';
}

export const Scrollable = DecoratorUtils.registerMethodDecorator(ScrollableOptions);
