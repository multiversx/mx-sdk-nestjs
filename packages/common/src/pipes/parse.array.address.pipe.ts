import { Address } from "@elrondnetwork/erdjs/out";
import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";


export class ParseArrayAddressPipe implements PipeTransform<string | undefined, Promise<string[] | undefined>> {
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

      try {
        for (const distinctValue of valueArray) {
          new Address(distinctValue);
        }
        return resolve(valueArray);
      } catch (error) {
        throw new BadRequestException(`Validation failed for argument '${metadata.data}' (a bech32 address is expected)`);
      }
    });
  }
}
