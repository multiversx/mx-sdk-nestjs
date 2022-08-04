import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";

export class RegexPipe implements PipeTransform<string | undefined, Promise<string | undefined>> {
  private readonly regexes: RegExp[];

  constructor(
    regex: RegExp | RegExp[],
    private readonly message: string = 'Invalid format'
  ) {
    if (Array.isArray(regex)) {
      this.regexes = regex;
    } else {
      this.regexes = [regex];
    }
  }

  transform(value: string | undefined, metadata: ArgumentMetadata): Promise<string | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      for (const regex of this.regexes) {
        if (regex.test(value)) {
          return resolve(value);
        }
      }

      throw new BadRequestException(`Validation failed for argument '${metadata.data}': ${this.message}.`);
    });
  }
}
