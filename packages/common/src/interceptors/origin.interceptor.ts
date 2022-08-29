import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
import { ContextTracker } from "../utils/context.tracker";

@Injectable()
export class OriginInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const apiFunction = context.getClass().name + '.' + context.getHandler().name;

    ContextTracker.assign({ origin: apiFunction });

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
