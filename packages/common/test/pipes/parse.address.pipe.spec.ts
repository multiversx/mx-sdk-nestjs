import { ArgumentMetadata } from "@nestjs/common";
import { ParseAddressPipe } from "../../src/pipes/parse.address.pipe";

describe('ParseAddressPipe', () => {
  let target: ParseAddressPipe;

  beforeEach(() => {
    target = new ParseAddressPipe;
  });

  describe('transform', () => {
    describe('when validation passes', () => {
      it('shoudl return address', async () => {
        const address: string = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
        expect(await target.transform(address, {} as ArgumentMetadata)).toStrictEqual('erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz');
      });
    });

    describe('when validation fails', () => {
        // eslint-disable-next-line require-await
        it('should throw an error', async () => {
            return expect(target.transform('invalidAddress', {} as ArgumentMetadata)).rejects.toThrowError();
        });
    });
  });
});
