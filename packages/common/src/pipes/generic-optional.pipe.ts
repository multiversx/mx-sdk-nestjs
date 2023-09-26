import { ArgumentMetadata, PipeTransform } from '@nestjs/common';

export class GenericOptionalPipe implements PipeTransform {
  constructor(
    private readonly pipeTransform: PipeTransform,
  ) { }
  transform(
    input: unknown,
    metadata: ArgumentMetadata,
  ): unknown {
    if (input == null) {
      return input;
    }
    return this.pipeTransform.transform(input, metadata);
  }
}
