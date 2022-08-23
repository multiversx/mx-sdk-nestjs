import { BadRequestException } from "@nestjs/common";

export class ComplexityExceededException extends BadRequestException {
  constructor(complexity: number, threshold: number) {
    super(`Complexity ${complexity} exceeded threshold ${threshold}.`);
  }
}
