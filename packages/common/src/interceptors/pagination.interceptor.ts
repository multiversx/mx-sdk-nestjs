import { CallHandler, ExecutionContext, HttpException, HttpStatus, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";

export class PaginationInterceptor implements NestInterceptor {
  constructor(private readonly maxSize: number = 100000) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const request = context.getArgByIndex(0);

    const from: number = parseInt(request.query.from || 0);
    const size: number = parseInt(request.query.size || 25);

    if (from + size > this.maxSize) {
      throw new HttpException(`Result window is too large, from + size must be less than or equal to: [${this.maxSize}] but was [${from + size}]`, HttpStatus.BAD_REQUEST);
    }

    return next.handle();
  }
}
