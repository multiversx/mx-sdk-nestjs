import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
import { MetricsService } from "src/common/metrics/metrics.service";
import { PerformanceProfiler } from "../utils/performance.profiler";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: MetricsService,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
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
        }),
        catchError(err => {
          profiler.stop();

          const statusCode = err.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
          this.metricsService.setApiCall(apiFunction, origin, statusCode, profiler.duration);

          return throwError(() => err);
        })
      );
  }
}
