import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Observable, of, throwError } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
import { MetricsService } from "../common/metrics/metrics.service";
import { CachingService } from "../common/caching/caching.service";
import { NoCacheOptions } from "../decorators/no.cache";
import { DecoratorUtils } from "../utils/decorator.utils";
import { Constants } from "../utils/constants";
import { ElrondCachingService } from "../common";

@Injectable()
export class CachingInterceptor implements NestInterceptor {
  private pendingRequestsDictionary: { [key: string]: any; } = {};

  constructor(
    private readonly cachingService: CachingService | ElrondCachingService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly metricsService: MetricsService,
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const apiFunction = context.getClass().name + '.' + context.getHandler().name;

    const cachingMetadata = DecoratorUtils.getMethodDecorator(NoCacheOptions, context.getHandler());
    if (cachingMetadata) {
      return next.handle();
    }

    this.metricsService.setPendingRequestsCount(Object.keys(this.pendingRequestsDictionary).length);

    const cacheKey = this.getCacheKey(context);
    if (cacheKey) {
      const pendingRequest = this.pendingRequestsDictionary[cacheKey];
      if (pendingRequest) {
        const result = await pendingRequest;
        this.metricsService.incrementPendingApiHit(apiFunction);

        if (result instanceof HttpException) {
          return throwError(() => result);
        } else {
          return of(result);
        }
      }

      const cachedValue = this.cachingService instanceof ElrondCachingService
        ? await this.cachingService.getLocal(cacheKey)
        : await this.cachingService.getCacheLocal(cacheKey);
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

            this.cachingService instanceof ElrondCachingService
              ? await this.cachingService.setLocal(cacheKey ?? '', result, Constants.oneSecond() * 3)
              : await this.cachingService.setCacheLocal(cacheKey ?? '', result, Constants.oneSecond() * 3);
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
    const httpAdapter = this.httpAdapterHost.httpAdapter;

    const request = context.getArgByIndex(0);
    if (httpAdapter.getRequestMethod(request) !== 'GET') {
      return undefined;
    }

    return httpAdapter.getRequestUrl(request);
  }
}
