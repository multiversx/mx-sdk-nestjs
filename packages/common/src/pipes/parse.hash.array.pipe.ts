import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from "@nestjs/common";

export class ParseHashArrayPipe
  implements
    PipeTransform<
      string | string[] | undefined,
      Promise<string | string[] | undefined>
    >
{
  private entity: string;
  private length: number;

  constructor(entity: string, length: number) {
    this.entity = entity;
    this.length = length;
  }

  transform(
    value: string | string[] | undefined,
    metadata: ArgumentMetadata
  ): Promise<string | string[] | undefined> {
    return new Promise((resolve) => {
      if (value === undefined || value === "") {
        return resolve(undefined);
      }

      const hashes = Array.isArray(value) ? value : value.split(",");

      for (const hash of hashes) {
        if (hash.length !== this.length) {
          throw new BadRequestException(
            `Validation failed for ${this.entity} hash '${metadata.data}'. Length should be ${this.length}.`
          );
        }
      }

      return resolve(hashes);
    });
  }
}
