import { Constants, ContextTracker, DecoratorUtils, ScrollableOptions, ScrollableCreateOptions, ScrollableAfterOptions } from "@multiversx/sdk-nestjs-common";
import { BadRequestException, CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, catchError, tap, throwError } from "rxjs";
import { randomUUID } from "crypto";
import { CacheService } from "../cache";

@Injectable()
export class ScrollInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<any>();
    const request = httpContext.getRequest();

    const scrollable = DecoratorUtils.getMethodDecorator(ScrollableOptions, context.getHandler());
    if (!scrollable) {
      return next.handle();
    }

    const scrollCollection = scrollable.collection;
    if (!scrollCollection) {
      return next.handle();
    }

    const scrollCreate = request.query.scrollCreate;
    const scrollAfter = request.query.scrollAfter;
    const scrollAt = request.query.scrollAt;

    const queryParams = JSON.parse(JSON.stringify(request.query));
    delete queryParams.scrollCreate;
    delete queryParams.scrollAfter;
    delete queryParams.scrollAt;

    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    let scrollId: string | undefined = undefined;

    if (scrollCreate) {
      if (scrollCreate === 'true') {
        scrollId = randomUUID();

        // create uuid and store
        ContextTracker.assign({
          scrollSettings: new ScrollableCreateOptions({
            collection: scrollCollection,
            create: true,
          }),
        });
      } else if (guidRegex.test(scrollCreate)) {
        scrollId = scrollCreate;

        ContextTracker.assign({
          scrollSettings: new ScrollableCreateOptions({
            collection: scrollCollection,
            create: true,
          }),
        });
      } else {
        throw new Error('Invalid scrollCreate value');
      }
    }

    if (scrollAfter) {
      if (guidRegex.test(scrollAfter)) {
        scrollId = scrollAfter;

        const scrollInfo: any = await this.cacheService.get(`scrollInfo:${scrollId}`);
        if (!scrollInfo) {
          throw new BadRequestException(`Could not find scroll info for '${scrollId}'`);
        }

        if (JSON.stringify(scrollInfo.queryParams) !== JSON.stringify(queryParams)) {
          throw new BadRequestException('Invalid query params');
        }

        if (scrollInfo) {
          ContextTracker.assign(
            new ScrollableAfterOptions({
              collection: scrollCollection,
              after: scrollInfo.lastSort,
              ids: scrollInfo.lastIds,
            })
          );
        }
      } else {
        throw new Error('Invalid scrollAfter value');
      }
    }

    if (scrollAt) {
      if (guidRegex.test(scrollAt)) {
        scrollId = scrollAt;

        const scrollInfo: any = await this.cacheService.get(`scrollInfo:${scrollId}`);
        if (!scrollInfo) {
          throw new BadRequestException(`Could not find scroll info for '${scrollId}'`);
        }

        if (scrollInfo.queryParams.sort !== queryParams.sort) {
          throw new BadRequestException('Invalid query params');
        }

        if (scrollInfo) {
          ContextTracker.assign(
            new ScrollableAfterOptions({
              collection: scrollCollection,
              after: scrollInfo.firstSort,
            })
          );
        }
      } else {
        throw new Error('Invalid scrollAt value');
      }
    }

    return next
      .handle()
      .pipe(
        tap(async () => {
          const contextObj = ContextTracker.get();
          const scrollResult = contextObj?.scrollResult;
          if (scrollResult) {
            if (scrollId) {
              response.setHeader('X-Scroll-Id', scrollId);
            }

            const scrollResultToSave = {
              ...scrollResult,
              queryParams,
            };

            await this.cacheService.set(`scrollInfo:${scrollId}`, scrollResultToSave, Constants.oneMinute() * 10);
          }
        }),
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }
}
