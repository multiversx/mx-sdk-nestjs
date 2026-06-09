import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ExecutionContextUtils } from '@multiversx/sdk-nestjs-common';

export const NativeAuth = createParamDecorator((key, ctx: ExecutionContext) => {
  const nativeAuth = ExecutionContextUtils.getRequest(ctx)?.nativeAuth;

  if (!nativeAuth) {
    return undefined;
  }

  if (key === undefined) {
    return nativeAuth;
  }

  return nativeAuth[key];
});
