import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { AddressUtils } from "../utils/address.utils";

export class ParseAddressArrayPipe implements PipeTransform<string | undefined, Promise<string[] | undefined>> {
  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<string[] | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const addresses = Array.isArray(value) ? value : value.split(',');

      for (const address of addresses) {
        if (!AddressUtils.isAddressValid(address)) {
          throw new BadRequestException(`Validation failed for argument '${metadata.data}'. Address '${address}' is not valid`);
        }
      }

      return resolve(addresses);
    });
  }
}
