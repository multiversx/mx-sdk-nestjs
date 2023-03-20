import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { AddressUtils } from "../utils/address.utils";

export class ParseAddressPipe implements PipeTransform<string | undefined, Promise<string | undefined>> {
  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<string | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      if (AddressUtils.isAddressValid(value)) {
        return resolve(value);
      }

      throw new BadRequestException(`Validation failed for argument '${metadata.data}' (a bech32 address is expected)`);
    });
  }
}
