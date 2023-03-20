import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { AddressUtils } from "../utils/address.utils";

export class ParseAddressAndMetachainPipe implements PipeTransform<string | undefined, Promise<string | undefined>> {
  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<string | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      if (value == "4294967295") {
        return resolve(value);
      }

      if (AddressUtils.isAddressValid(value)) {
        return resolve(value);
      }

      throw new BadRequestException(`Validation failed for argument '${metadata.data}'. Address '${value}' is not valid`);
    });
  }
}
