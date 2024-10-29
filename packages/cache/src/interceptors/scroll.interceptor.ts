import { Constants, ContextTracker, DecoratorUtils, ScrollableAfterSettings, ScrollableCreateSettings } from "@multiversx/sdk-nestjs-common";
import { BadRequestException, CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, catchError, tap, throwError } from "rxjs";
import { randomUUID } from "crypto";
import { CacheService } from "../cache";
import { ScrollableOptions } from "src/decorators";

@Injectable()
export class ScrollInterceptor implements NestInterceptor {
  guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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

    const queryParams = JSON.parse(JSON.stringify(request.query));
    delete queryParams.scrollCreate;
    delete queryParams.scrollAfter;
    delete queryParams.scrollAt;

    let scrollId = this.handleScrollCreate(request, scrollCollection);
    scrollId = await this.handleScrollAt(request, scrollCollection, queryParams);
    scrollId = await this.handleScrollAfter(request, scrollCollection, queryParams);

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

  private handleScrollCreate(request: any, scrollCollection: string): string | undefined {
    const scrollCreate = request.query.scrollCreate;
    if (!scrollCreate) {
      return;
    }

    let scrollId = undefined;

    if (scrollCreate === 'true') {
      scrollId = randomUUID();
    } else if (this.guidRegex.test(scrollCreate)) {
      scrollId = scrollCreate;
    }

    if (!scrollId) {
      throw new Error('Invalid scrollCreate value');
    }

    ContextTracker.assign({
      scrollSettings: new ScrollableCreateSettings({
        collection: scrollCollection,
        create: true,
      }),
    });

    return scrollId;
  }

  private async handleScrollAfter(request: any, scrollCollection: string, queryParams: any): Promise<string | undefined> {
    let scrollId = undefined;

    const scrollAfter = request.query.scrollAfter;
    if (scrollAfter && this.guidRegex.test(scrollAfter)) {
      scrollId = scrollAfter;
    } else {
      throw new Error('Invalid scrollAfter value');
    }

    const scrollInfo: any = await this.cacheService.get(`scrollInfo:${scrollId}`);
    if (!scrollInfo) {
      throw new BadRequestException(`Could not find scroll info for '${scrollId}'`);
    }

    if (JSON.stringify(scrollInfo.queryParams) !== JSON.stringify(queryParams)) {
      throw new BadRequestException('Invalid query params');
    }

    ContextTracker.assign({
      scrollSettings: new ScrollableAfterSettings({
        collection: scrollCollection,
        after: scrollInfo.lastSort,
        ids: scrollInfo.lastIds,
      }),
    });

    return scrollId;
  }

  private async handleScrollAt(request: any, scrollCollection: string, queryParams: any): Promise<string | undefined> {
    let scrollId = undefined;

    const scrollAt = request.query.scrollAt;
    if (scrollAt && this.guidRegex.test(scrollAt)) {
      scrollId = scrollAt;
    } else {
      throw new Error('Invalid scrollAt value');
    }

    const scrollInfo: any = await this.cacheService.get(`scrollInfo:${scrollId}`);
    if (!scrollInfo) {
      throw new BadRequestException(`Could not find scroll info for '${scrollId}'`);
    }

    if (scrollInfo.queryParams.sort !== queryParams.sort) {
      throw new BadRequestException('Invalid query params');
    }

    ContextTracker.assign({
      scrollSettings: new ScrollableAfterSettings({
        collection: scrollCollection,
        after: scrollInfo.firstSort,
        ids: scrollInfo.lastIds,
      }),
    });

    return scrollId;
  }
}
