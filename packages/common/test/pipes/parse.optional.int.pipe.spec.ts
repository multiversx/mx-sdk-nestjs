import { ArgumentMetadata } from "@nestjs/common";
import { ParseIntPipe } from "../../src/pipes/parse.int.pipe";

describe('ParseOptionalIntPipe', () => {
  let target: ParseIntPipe;

  beforeEach(() => {
    target = new ParseIntPipe;
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
