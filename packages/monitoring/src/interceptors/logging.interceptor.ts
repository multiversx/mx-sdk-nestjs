import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { MetricsService } from "../metrics";
import { PerformanceProfiler } from "../profilers/performance.profiler";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly onRequest?: (apiFunction: string, durationMs: number, context: ExecutionContext) => void,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const apiFunction = context.getClass().name + '.' + context.getHandler().name;

    const profiler = new PerformanceProfiler(apiFunction);

    const request = context.getArgByIndex(0);

    let origin = request.headers['origin'];
    if (!origin) {
      origin = 'Unknown';
    }

    return next
      .handle()
      .pipe(
        tap(() => {
          profiler.stop();

          const http = context.switchToHttp();
          const res = http.getResponse();

          this.metricsService.setApiCall(apiFunction, origin, res.statusCode, profiler.duration);

          if (this.onRequest) {
            this.onRequest(apiFunction, profiler.duration, context);
          }
        }),
        catchError(err => {
          profiler.stop();

          const statusCode = err.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
          this.metricsService.setApiCall(apiFunction, origin, statusCode, profiler.duration);

          if (this.onRequest) {
            this.onRequest(apiFunction, profiler.duration, context);
          }

          return throwError(() => err);
        })
      );
  }
}
