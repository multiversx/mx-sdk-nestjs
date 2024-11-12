import { ExecutionContext } from "@nestjs/common";

export class LoggingInterceptorContext {
  apiFunction: string = '';
  durationMs: number = 0;
  origin: string = '';
  statusCode: number = 0;
  context!: ExecutionContext;

  constructor(init?: Partial<LoggingInterceptorContext>) {
    Object.assign(this, init);
  }
}
