import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";

export class ParseBoolPipe implements PipeTransform<string | boolean, Promise<boolean | undefined>> {
  transform(value: string | boolean, metadata: ArgumentMetadata): Promise<boolean | undefined> {
    return new Promise(resolve => {
      if (value === true || value === 'true') {
        return resolve(true);
      }

      if (value === false || value === 'false') {
        return resolve(false);
      }

      if (value === null || value === undefined || value === '') {
        return resolve(undefined);
      }

      throw new BadRequestException(`Validation failed for argument '${metadata.data}' (optional boolean string is expected)`);
    });
  }
}
