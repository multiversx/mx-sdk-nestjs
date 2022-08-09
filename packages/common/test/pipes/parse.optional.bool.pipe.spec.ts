import { ArgumentMetadata } from "@nestjs/common";
import { ParseOptionalBoolPipe } from "../../src/pipes/parse.optional.bool.pipe";

describe('ParseOptionalBoolPipe', () => {
  let target: ParseOptionalBoolPipe;

  beforeEach(() => {
    target = new ParseOptionalBoolPipe;
  });

  describe('transform', () => {
    describe('when validation passes', () => {
      it('should return boolean', async () => {
        expect(await target.transform('true', {} as ArgumentMetadata)).toBeTruthy();
        expect(await target.transform(true, {} as ArgumentMetadata)).toBeTruthy();
        expect(await target.transform('false', {} as ArgumentMetadata)).toBeFalsy();
        expect(await target.transform(false, {} as ArgumentMetadata)).toBeFalsy();
      });
    });

    describe('when validation fails', () => {
      it('shoul throw an error', () => {
        return expect(target.transform('abc123', {} as ArgumentMetadata)).rejects.toThrowError();
      });
    });
  });
});
