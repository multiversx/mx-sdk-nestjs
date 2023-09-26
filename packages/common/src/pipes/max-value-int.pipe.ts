import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class MaxValueIntPipe implements PipeTransform {
  private readonly maxValue: number;

  constructor(
    maxValue: number,
  ) {
    this.maxValue = maxValue;
  }

  transform(input: number): number {
    if (input > this.maxValue) {
      throw new BadRequestException({
        error: 'value_too_big',
      });
    }

    return input;
  }
}
