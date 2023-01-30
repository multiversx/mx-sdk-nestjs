import { createParamDecorator } from "@nestjs/common";

export const Jwt = createParamDecorator((field, req) => {
  const jwt = req.args[0].jwt;

  if (jwt && field) {
    const fieldsChain = field.split('.');
    const data = fieldsChain.reduce((value: any, field: string) => value ? value[field] : undefined, jwt);
    return data;
  }

  return jwt;
});
