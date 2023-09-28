import { ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { ParseCollectionArrayPipe } from "../../../common/src/pipes/parse.collection.array.pipe";

describe('ParseCollectionArrayPipe', () => {
  let target: ParseCollectionArrayPipe;

  beforeEach(() => {
    target = new ParseCollectionArrayPipe();
  });

  describe('transform', () => {
    describe('when validation passes', () => {
      it('should return array of collection identifiers', async () => {
        const validCollectionIdentifier = 'ABCDE-efb116';
        expect(await target.transform(validCollectionIdentifier, {} as ArgumentMetadata)).toStrictEqual([validCollectionIdentifier]);
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
        const invalidCollectionIdentifier = 'ABCDE-efb116-02';
        await expect(target.transform(invalidCollectionIdentifier, {} as ArgumentMetadata)).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException even if array contains a valid collection identifier', async () => {
        const invalidCollectionIdentifiers = ['ABCDE-efb116-02', 'ABCDE-efb116'];
        await expect(target.transform(invalidCollectionIdentifiers, {} as ArgumentMetadata)).rejects.toThrow(BadRequestException);
      });
    });
  });
});