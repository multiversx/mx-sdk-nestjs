import { ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { ParseNftArrayPipe } from "../../../common/src/pipes/parse.nft.array.pipe";

describe('ParseNftArrayPipe', () => {
  let target: ParseNftArrayPipe;

  beforeEach(() => {
    target = new ParseNftArrayPipe();
  });

  describe('transform', () => {
    describe('when validation passes', () => {
      it('should return array of NFT identifiers', async () => {
        const validNftIdentifier = 'ABCDE-efb116-02';
        expect(await target.transform(validNftIdentifier, {} as ArgumentMetadata)).toStrictEqual([validNftIdentifier]);
      });

      it('should throw BadRequestException even if array contains a valid identifier', async () => {
        const validNftIdentifier = 'ABCDE-efb116-02';
        expect(await target.transform(validNftIdentifier, {} as ArgumentMetadata)).toStrictEqual([validNftIdentifier]);
      });

      it('should return undefined for an empty string', async () => {
        expect(await target.transform('', {} as ArgumentMetadata)).toBeUndefined();
      });

      it('should return undefined for undefined value', async () => {
        expect(await target.transform(undefined, {} as ArgumentMetadata)).toBeUndefined();
      });
    });

    describe('when validation fails', () => {
      it('should throw BadRequestException', async () => {
        const invalidNftIdentifier = 'ABCDE-efb116';
        await expect(target.transform(invalidNftIdentifier, {} as ArgumentMetadata)).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException even if array contains a valid identifier', async () => {
        const invalidNftIdentifiers = ['ABCDE-efb116-02', 'ABCDE-efb116'];
        await expect(target.transform(invalidNftIdentifiers, {} as ArgumentMetadata)).rejects.toThrow(BadRequestException);
      });
    });
  });
});