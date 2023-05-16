import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';
import { ApiUtils } from "../api.utils";

@Injectable()
export class CleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    return next
      .handle()
      .pipe(
        tap(result => ApiUtils.cleanupApiValueRecursively(result))
      );
  }
}
