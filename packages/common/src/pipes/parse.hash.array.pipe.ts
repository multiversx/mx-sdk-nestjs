import { Hash } from "@elrondnetwork/erdjs/out/hash";
import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";

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

      try {
        const hashes = Array.isArray(value) ? value : value.split(',');

        for (const hash of hashes) {
          const txhash = new Hash(hash);
          if (txhash.toString().length !== this.length) {
            throw Error();
          }
        }

        return resolve(hashes);
      } catch (error) {
        throw new BadRequestException(`Validation failed for argument '${metadata.data}' (a valid ${this.entity} hash is expected)`);
      }
    });
  }
}
