import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeFieldsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const request = context.getArgByIndex(0);

    return next
      .handle()
      .pipe(
        map((resultRef) => {
          if (typeof resultRef !== 'object' || resultRef === null) {
            return resultRef;
          }

          const result = JSON.parse(JSON.stringify(resultRef));
          const excludeFieldsArgument = request.query.excludeFields;
          if (excludeFieldsArgument) {
            const excludeFields = Array.isArray(excludeFieldsArgument) ? excludeFieldsArgument : excludeFieldsArgument.split(',');
            if (Array.isArray(result)) {
              for (const item of result) {
                this.transformItem(item, excludeFields);
              }
            } else {
              this.transformItem(result, excludeFields);
            }
          }
          return result;
        })
      );
  }

  private transformItem(item: any, excludeFields: string[]) {
    for (const key of Object.keys(item)) {
      if (excludeFields.includes(key)) {
        delete item[key];
      }
    }
  }
}
