import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { ComplexityExceededException } from "../common/complexity/exceptions/complexity.exceeded.exception";
import { ApplyComplexityOptions } from "../common/complexity/apply.complexity";
import { DecoratorUtils } from "../utils/decorator.utils";
import { ComplexityUtils } from "../common/complexity/complexity.utils";

@Injectable()
export class ComplexityInterceptor implements NestInterceptor {
  private readonly complexityThreshold: number = 10000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const complexityMetadata = DecoratorUtils.getMethodDecorator<ApplyComplexityOptions>(ApplyComplexityOptions, context.getHandler());
    if (!complexityMetadata) {
      return next.handle();
    }

    const contextType: string = context.getType();

    if (["http", "https"].includes(contextType)) {
      this.handleHttpRequest(complexityMetadata.target, context);
    }

    return next
      .handle();
  }

  private handleHttpRequest(target: any, context: ExecutionContext) {
    const query = context.switchToHttp().getRequest().query;

    const fields: string[] = query.fields?.split(",") ?? [];

    for (const [field, value] of Object.entries(query)) {
      if (value === "true") {
        // special case for REST "resolvers" like "withScResults" or "withOperations".
        fields.push(field);
      }
    }

    const complexityTree = ComplexityUtils.updateComplexityTree(undefined, target, fields, query.size ?? 25);

    const complexity = complexityTree.getComplexity();
    if (complexity > this.complexityThreshold) {
      throw new ComplexityExceededException(complexity, this.complexityThreshold);
    }

    context.switchToHttp().getRequest().res.set('X-Request-Complexity', complexity);
  }
}
