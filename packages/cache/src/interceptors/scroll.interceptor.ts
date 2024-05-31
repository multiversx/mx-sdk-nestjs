import { Constants, ContextTracker, DecoratorUtils } from "@multiversx/sdk-nestjs-common";
import { BadRequestException, CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, catchError, tap, throwError } from "rxjs";
import { randomUUID } from "crypto";
import { ScrollableOptions } from "../decorators";
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
          scrollSettings: {
            scrollCollection: scrollCollection,
            scrollCreate: true,
          },
        });
      } else if (guidRegex.test(scrollCreate)) {
        scrollId = scrollCreate;

        ContextTracker.assign({
          scrollSettings: {
            scrollCollection: scrollCollection,
            scrollCreate: true,
          },
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
          ContextTracker.assign({
            scrollSettings: {
              scrollCollection: scrollCollection,
              scrollAfter: scrollInfo.lastSort,
              ids: scrollInfo.lastIds,
              queryParams,
            },
          });
        }
      } else {
        throw new Error('Invalid scrollAfter value');
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

            await this.cacheService.set(`scrollInfo:${scrollId}`, {
              ...scrollResult,
              queryParams,
            }, Constants.oneHour());
          }
        }),
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }
}
