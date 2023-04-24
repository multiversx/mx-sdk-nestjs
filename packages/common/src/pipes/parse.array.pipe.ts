import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { ParseArrayPipeOptions } from "./entities/parse.array.options";

export class ParseArrayPipe implements PipeTransform<string | undefined, Promise<string[] | undefined>> {
  private readonly options: ParseArrayPipeOptions;
  private readonly DEFAULT_MAX_ARRAY_SIZE = 1024;

  constructor(options?: Partial<ParseArrayPipeOptions>) {
    this.options = options ? new ParseArrayPipeOptions(options) : new ParseArrayPipeOptions();
  }

  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<string[] | undefined> {
    return new Promise(resolve => {
      if (value === undefined || (!this.options.allowEmptyString && value === '')) {
        return resolve(undefined);
      }

      const valueArray = value.split(',');

      const maxArraySize = this.options.maxArraySize ?? this.DEFAULT_MAX_ARRAY_SIZE;

      if (valueArray.length > maxArraySize) {
        throw new BadRequestException(`Validation failed for argument '${metadata.data}' (less than ${maxArraySize} comma separated values expected)`);
      }

      const distinctValueArray = valueArray.distinct();

      resolve(distinctValueArray);
    });
  }
}
