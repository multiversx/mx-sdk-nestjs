import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";

export class ParseRecordPipe implements PipeTransform<string | undefined, Promise<Record<string, string> | undefined>> {
  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<Record<string, string> | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const result: Record<string, string> = {};

      const entries = value.split(';');

      for (const entry of entries) {
        const [key, value] = entry.split(':');
        if (!key || !value) {
          throw new BadRequestException(`Validation failed for argument '${metadata.data}'. Value should be in the format '<key1>:<value1>;<key2>:<value2>'`);
        }

        result[key] = value;
      }

      return resolve(result);
    });
  }
}
