import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class StringLengthPipe implements PipeTransform {
  private readonly minLength: number;
  private readonly maxLength: number | undefined;

  constructor(
    minLength: number,
    maxLength: number | undefined = undefined,
  ) {
    this.minLength = minLength;
    this.maxLength = maxLength;
  }

  transform(input: string): string {
    if (input == null ||
      input.length < this.minLength ||
      (this.maxLength && input.length > this.maxLength)) {
      throw new BadRequestException({
        error: 'invalid_input_string_length',
      });
    }

    return input;
  }
}
