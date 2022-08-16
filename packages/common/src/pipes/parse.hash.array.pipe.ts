import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { HashUtils } from "src/utils/hash.utils";

export class ParseHashArrayPipe implements PipeTransform<string | undefined, Promise<string[] | undefined>> {
  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<string[] | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const hashes = Array.isArray(value) ? value : value.split(',');

      for (const hash of hashes) {
        if (!HashUtils.isHashValid(hash)) {
          throw new BadRequestException(`Validation failed for argument '${metadata.data}' (a valid txHash is expected)`);
        }
      }

      return resolve(hashes);
    });
  }
}
