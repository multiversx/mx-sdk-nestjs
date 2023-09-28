import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { TokenUtils } from "../utils/token.utils";

export class ParseNftArrayPipe implements PipeTransform<string | string[] | undefined, Promise<string | string[] | undefined>> {

  transform(value: string | string[] | undefined, metadata: ArgumentMetadata): Promise<string | string[] | undefined> {
    return new Promise((resolve) => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const values = Array.isArray(value) ? value : value.split(',');

      for (const value of values) {
        if (!TokenUtils.isNft(value)) {
          throw new BadRequestException(`Validation failed for '${metadata.data}'. Value ${value} does not represent a valid NFT identifier`);
        }
      }

      return resolve(values);
    });
  }
}
