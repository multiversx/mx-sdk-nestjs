import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { BinaryUtils } from "../utils/binary.utils";

export class ParseHashArrayPipe implements PipeTransform<string | string[] | undefined, Promise<string | string[] | undefined>> {
  private entity: string;
  private length: number;

  constructor(entity: string, length: number) {
    this.entity = entity;
    this.length = length;
  }

  transform(value: string | string[] | undefined, metadata: ArgumentMetadata): Promise<string | string[] | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const hashes = Array.isArray(value) ? value : value.split(',');

      for (const hash of hashes) {
        if (!BinaryUtils.isHash(hash)) {
          throw new BadRequestException(`Validation failed for ${this.entity} hash '${metadata.data}'. Value does not represent a hash`);
        }

        if (hash.length !== this.length) {
          throw new BadRequestException(`Validation failed for ${this.entity} hash '${metadata.data}'. Length should be ${this.length}.`);
        }
      }

      return resolve(hashes);
    });
  }
}
