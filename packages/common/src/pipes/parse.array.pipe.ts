import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";


export class ParseArrayPipe implements PipeTransform<string | undefined, Promise<string[] | undefined>> {
  private readonly maxArraySize;

  constructor(maxArraySize: number = 1024) {
    this.maxArraySize = maxArraySize;
  }

  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<string[] | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const valueArray = value.split(',');

      if (valueArray.length > this.maxArraySize) {
        throw new BadRequestException(`Validation failed for argument '${metadata.data}' (less than ${this.maxArraySize} comma separated values expected)`);
      }

      const distinctValueArray = valueArray.distinct();

      resolve(distinctValueArray);
    });
  }
}
