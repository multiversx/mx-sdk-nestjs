import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Observable, of, throwError } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
import { DecoratorUtils, Constants } from "@multiversx/sdk-nestjs-common";
import { MetricsService } from "@multiversx/sdk-nestjs-monitoring";
import { CacheService } from "../cache";
import { NoCacheOptions } from "../decorators";

@Injectable()
export class CachingInterceptor implements NestInterceptor {
  private pendingRequestsDictionary: { [key: string]: any; } = {};

  constructor(
    private readonly cachingService: CacheService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly metricsService: MetricsService,
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const request = context.getArgByIndex(0);

    if (request.headers['no-cache'] === 'true') {
      return next.handle();
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    if (httpAdapter.getRequestMethod(request) !== 'GET') {
      return next.handle();
    }

    const apiFunction = context.getClass().name + '.' + context.getHandler().name;

    const cachingMetadata = DecoratorUtils.getMethodDecorator(NoCacheOptions, context.getHandler());
    if (cachingMetadata) {
      return next.handle();
    }

    console.log({ params: Object.keys(request.query) });
    for (const paramName of Object.keys(request.query)) {
      if (['scrollCreate', 'scrollAt', 'scrollAfter'].includes(paramName)) {
        return next.handle();
      }
    }

    this.metricsService.setPendingRequestsCount(Object.keys(this.pendingRequestsDictionary).length);

    const cacheKey = this.getCacheKey(context);
    if (cacheKey) {
      const pendingRequest = this.pendingRequestsDictionary[cacheKey];
      if (pendingRequest) {
        const result = await pendingRequest;
        this.metricsService.incrementPendingApiHit(apiFunction);

        if (result instanceof Error) {
          return throwError(() => result);
        } else {
          return of(result);
        }
      }

      const cachedValue = await this.cachingService.getLocal(cacheKey);
      if (cachedValue) {
        this.metricsService.incrementCachedApiHit(apiFunction);
        return of(cachedValue);
      }

      let pendingRequestResolver: (value: any) => null;
      this.pendingRequestsDictionary[cacheKey] = new Promise((resolve) => {
        // @ts-ignore
        pendingRequestResolver = resolve;
      });

      return next
        .handle()
        .pipe(
          tap(async (result: any) => {
            delete this.pendingRequestsDictionary[cacheKey ?? ''];
            pendingRequestResolver(result);
            this.metricsService.setPendingRequestsCount(Object.keys(this.pendingRequestsDictionary).length);

            await this.cachingService.setLocal(cacheKey ?? '', result, Constants.oneSecond() * 3);
          }),
          catchError((err) => {
            delete this.pendingRequestsDictionary[cacheKey ?? ''];
            pendingRequestResolver(err);
            this.metricsService.setPendingRequestsCount(Object.keys(this.pendingRequestsDictionary).length);

            return throwError(() => err);
          })
        );
    }

    return next.handle();
  }

  getCacheKey(context: ExecutionContext): string | undefined {
    const request = context.getArgByIndex(0);

    return `${context.getClass().name}.${context.getHandler().name}.${JSON.stringify(request.query)}.${JSON.stringify(request.params)}`;
  }
}
