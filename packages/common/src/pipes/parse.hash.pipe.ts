import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from "@nestjs/common";

export class ParseHashPipe
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

      const values = Array.isArray(value) ? value : [value];

      for (const _value of values) {
        if (_value.length !== this.length) {
          throw new BadRequestException(
            `Validation failed for ${this.entity} hash '${metadata.data}'. Length should be ${this.length}.`
          );
        }
      }

      return resolve(value);
    });
  }
}
