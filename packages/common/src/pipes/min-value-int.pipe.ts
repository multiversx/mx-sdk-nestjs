import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class MinValueIntPipe implements PipeTransform {
  private readonly minValue: number;

  constructor(
    minValue: number,
  ) {
    this.minValue = minValue;
  }

  transform(input: number): number {
    if (input < this.minValue) {
      throw new BadRequestException({
        error: 'value_too_small',
      });
    }

    return input;
  }
}
