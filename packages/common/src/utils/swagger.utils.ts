import { ApiPropertyOptions } from "@nestjs/swagger";
import { Amount } from "../common/entities/amount";

export class SwaggerUtils {
  static amountPropertyOptions(extraOptions?: ApiPropertyOptions): ApiPropertyOptions {
    return {
      type: Amount,
      example: `\"${(Math.round(Math.random() * (10 ** 3))) * (10 ** 16)}\"`,
      title: 'Amount',
      ...extraOptions,
    };
  }
}
