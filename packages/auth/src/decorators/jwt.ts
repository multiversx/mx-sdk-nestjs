import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ExecutionContextUtils } from "@multiversx/sdk-nestjs-common";

export const Jwt = createParamDecorator((field, ctx: ExecutionContext) => {
  const jwt = ExecutionContextUtils.getRequest(ctx)?.jwt;

  if (jwt && field) {
    const fieldsChain = field.split('.');
    const data = fieldsChain.reduce((value: any, field: string) => value ? value[field] : undefined, jwt);
    return data;
  }

  return jwt;
});
