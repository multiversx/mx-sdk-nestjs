import { Address } from "@elrondnetwork/erdjs/out";
import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";

export class AddressAndMetachainValidationPipe implements PipeTransform<string | undefined, Promise<string | undefined>> {
  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<string | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      try {
        if (value == "4294967295") {
          return resolve(value);
        }

        if (new Address(value)) {
          return resolve(value);
        }
      } catch (error) {
        throw new BadRequestException(`Validation failed for argument '${metadata.data}'. Address '${value}' is not valid`);
      }
    });
  }
}
