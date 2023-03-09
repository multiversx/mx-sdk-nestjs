import { ExecutionContext } from "@nestjs/common";

export class ExecutionContextUtils {
  static getHeaders(context: ExecutionContext): Record<string, string> {
    const contextType: string = context.getType();
    if (["http", "https"].includes(contextType)) {
      const request = context.switchToHttp().getRequest();

      return request.headers;
    }

    if (contextType === "graphql") {
      return context.getArgByIndex(2).req.headers;
    }

    return {};
  }

  static getResponse(context: ExecutionContext): any {
    const contextType: string = context.getType();
    if (["http", "https"].includes(contextType)) {
      const request = context.switchToHttp().getRequest();

      return request.res;
    }

    return undefined;
  }

  static getRequest(context: ExecutionContext): any {
    const contextType: string = context.getType();
    if (["http", "https"].includes(contextType)) {
      const request = context.switchToHttp().getRequest();

      return request;
    }

    if (contextType === "graphql") {
      return context.getArgByIndex(2).req;
    }

    return undefined;
  }
}
