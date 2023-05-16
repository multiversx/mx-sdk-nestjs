import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { PerformanceProfiler, MetricsService } from '@multiversx/sdk-nestjs-monitoring';

@Injectable()
export class RabbitMqConsumerMonitoringInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: MetricsService,
  ) { }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const isRmqContext = isRabbitContext(context);
    if (!isRmqContext) {
      return next.handle();
    }

    const consumer = context.getClass().name;

    const profiler = new PerformanceProfiler();

    return next
      .handle()
      .pipe(
        tap(() => {
          this.metricsService.setConsumer(consumer, profiler.stop());
        }),
        catchError(err => {
          this.metricsService.setConsumer(consumer, profiler.stop());

          return throwError(() => err);
        }),
      );
  }
}
