import { ArgumentMetadata } from "@nestjs/common";
import { ParseOptionalIntPipe } from "../../src/pipes/parse.optional.int.pipe";

describe('ParseOptionalIntPipe', () => {
  let target: ParseOptionalIntPipe;

  beforeEach(() => {
    target = new ParseOptionalIntPipe;
  });

  describe('transform', () => {
    describe('when validation passes', () => {
      it('should return number', async () => {
        const number = '9';
        expect(await target.transform(number, {} as ArgumentMetadata),
        ).toStrictEqual(9);
      });

      it('should return negative number', async () => {
        const number = '-9';
        expect(await target.transform(number, {} as ArgumentMetadata),
        ).toStrictEqual(-9);
      });
    });

    describe('when validation fails', () => {
      it('should throw an error', () => {
        return expect(target.transform('abc123', {} as ArgumentMetadata),
        ).rejects.toThrowError();
      });

      // it('should throw an error when number has wrong number encoding', async () => {
      //     return expect(
      //       target.transform('0xFF', {} as ArgumentMetadata),
      //     ).rejects.toThrowError();
      //   });
    });
  });
});
