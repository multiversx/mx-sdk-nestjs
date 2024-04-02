import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';

export class ParseShardPipe implements PipeTransform<string | undefined, Promise<number | undefined>> {
  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const numValue = Number(value);
      if (isNaN(numValue)) {
        return reject(new BadRequestException(`Validation failed for argument '${metadata.data}' (number is expected)`));
      }

      if (![0, 1, 2, 4294967295].includes(numValue)) {
        return reject(new BadRequestException(`Validation failed for argument '${metadata.data}' (value must be one of [0,1,2,4294967295])`));
      }

      return resolve(numValue);
    });
  }
}
