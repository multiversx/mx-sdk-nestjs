import { DecoratorUtils } from "@multiversx/sdk-nestjs-common/lib/utils/decorator.utils";

export class DisableFieldsInterceptorOnControllerOptions { }

export const DisableFieldsInterceptorOnController = DecoratorUtils.registerClassDecorator(Object, DisableFieldsInterceptorOnControllerOptions);
