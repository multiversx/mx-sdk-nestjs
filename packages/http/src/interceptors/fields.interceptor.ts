import { DecoratorUtils } from "@multiversx/sdk-nestjs-common";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';
import { DisableFieldsInterceptorOnControllerOptions, DisableFieldsInterceptorOptions } from "./entities";

@Injectable()
export class FieldsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const disableFieldsInterceptorMethodMetadata = DecoratorUtils.getMethodDecorator(DisableFieldsInterceptorOptions, context.getHandler());
    if (disableFieldsInterceptorMethodMetadata) {
      return next.handle();
    }

    const disableFieldsInterceptorClassMetadata = DecoratorUtils.getClassDecorator(DisableFieldsInterceptorOnControllerOptions, context.getClass());
    if (disableFieldsInterceptorClassMetadata) {
      return next.handle();
    }

    const request = context.getArgByIndex(0);

    return next
      .handle()
      .pipe(
        map((resultRef) => {
          if (typeof resultRef !== 'object') {
            return resultRef;
          }

          const result = JSON.parse(JSON.stringify(resultRef));
          const fieldsArgument = request.query.fields;
          if (fieldsArgument) {
            const fields = Array.isArray(fieldsArgument) ? fieldsArgument : fieldsArgument.split(',');
            if (Array.isArray(result)) {
              for (const item of result) {
                this.transformItem(item, fields);
              }
            } else {
              this.transformItem(result, fields);
            }
          }
          return result;
        })
      );
  }

  private transformItem(item: any, fields: string[]) {
    for (const key of Object.keys(item)) {
      if (!fields.includes(key)) {
        delete item[key];
      }
    }
  }
}
