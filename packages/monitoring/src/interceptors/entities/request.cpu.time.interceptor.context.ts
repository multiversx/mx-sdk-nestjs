import { ExecutionContext } from '@nestjs/common';

export class RequestCpuTimeInterceptorContext {
  apiFunction: string = '';
  durationMs: number = 0;
  context!: ExecutionContext;

  constructor(init?: Partial<RequestCpuTimeInterceptorContext>) {
    Object.assign(this, init);
  }
}
