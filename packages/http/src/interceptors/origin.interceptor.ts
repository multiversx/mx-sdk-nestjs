import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
import { ContextTracker } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class OriginInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const apiFunction = context.getClass().name + '.' + context.getHandler().name;
    const requestId = context.switchToHttp().getRequest().headers['x-request-id'] ?? crypto.randomUUID();

    ContextTracker.assign({ origin: apiFunction, requestId });

    return next
      .handle()
      .pipe(
        tap(() => ContextTracker.unassign()),
        catchError(err => {
          ContextTracker.unassign();

          return throwError(() => err);
        })
      );
  }
}
