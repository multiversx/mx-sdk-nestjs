import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";

export class ParseIntPipe implements PipeTransform<string | undefined, Promise<number | undefined>> {
  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<number | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      if (!isNaN(Number(value))) {
        return resolve(Number(value));
      }

      throw new BadRequestException(`Validation failed for argument '${metadata.data}' (optional number is expected)`);
    });
  }
}
