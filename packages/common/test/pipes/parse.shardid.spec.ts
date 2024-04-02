import { ParseShardIdPipe } from "../../../common/src/pipes/parse.shardid.pipe";
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';

describe('ParseShardIdPipe', () => {
  let pipe: ParseShardIdPipe;

  beforeEach(() => {
    pipe = new ParseShardIdPipe();
  });

  it('should return undefined for undefined value', async () => {
    await expect(pipe.transform(undefined, {} as ArgumentMetadata)).resolves.toBeUndefined();
  });

  it('should return undefined for empty string', async () => {
    await expect(pipe.transform('', {} as ArgumentMetadata)).resolves.toBeUndefined();
  });

  it('should accept and return valid values', async () => {
    const validValues = ['0', '1', '2', '4294967295'];
    for (const value of validValues) {
      await expect(pipe.transform(value, {} as ArgumentMetadata)).resolves.toEqual(Number(value));
    }
  });

  it('should throw BadRequestException for values outside of specified range', async () => {
    const invalidValues = ['3', '-1', '4294967296'];
    for (const value of invalidValues) {
      await expect(pipe.transform(value, {} as ArgumentMetadata))
        .rejects.toThrow(BadRequestException);
    }
  });

  it('should throw BadRequestException for non-numeric values', async () => {
    const nonNumericValues = ['a', '1x', '!'];
    for (const value of nonNumericValues) {
      await expect(pipe.transform(value, {} as ArgumentMetadata))
        .rejects.toThrow(BadRequestException);
    }
  });
});
