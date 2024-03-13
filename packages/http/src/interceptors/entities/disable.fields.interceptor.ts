import { DecoratorUtils } from "@multiversx/sdk-nestjs-common/lib/utils/decorator.utils";

export class DisableFieldsInterceptorOptions { }

export const DisableFieldsInterceptor = DecoratorUtils.registerMethodDecorator(DisableFieldsInterceptorOptions);
