import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
import { MetricsService } from '../metrics';
import { CpuProfiler } from "../profilers/cpu.profiler";

@Injectable()
export class RequestCpuTimeInterceptor implements NestInterceptor {
  onRequest?: (apiFunction: string, durationMs: number, context: ExecutionContext) => void;
  constructor(
    private readonly metricsService: MetricsService
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const apiFunction = context.getClass().name + '.' + context.getHandler().name;
    const request = context.switchToHttp().getRequest();

    const profiler = new CpuProfiler();

    return next
      .handle()
      .pipe(
        tap(() => {
          const duration = profiler.stop();
          this.metricsService.setApiCpuTime(apiFunction, duration);

          if (this.onRequest) {
            this.onRequest(apiFunction, duration, context);
          }

          if (!request.res.headersSent) {
            request.res.set('X-Request-Cpu-Time', duration);
          }
        }),
        catchError(err => {
          const duration = profiler.stop();
          this.metricsService.setApiCpuTime(apiFunction, duration);

          if (this.onRequest) {
            this.onRequest(apiFunction, duration, context);
          }

          if (!request.res.headersSent) {
            request.res.set('X-Request-Cpu-Time', duration);
          }
          return throwError(() => err);
        })
      );
  }
}
