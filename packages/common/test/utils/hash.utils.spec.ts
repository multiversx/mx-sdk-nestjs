import { HashUtils } from "../../src/utils/hash.utils";

describe('Address utils', () => {

  it('Should return true if a given hash is valid', () => {
    expect(HashUtils.isHashValid('810f17077431ac21bf087c883f5b41dd391c1474bcd5e3fa46cb26e2d196c1ff')).toBeTruthy();
  });

  it('Should return false if a given hash is invalid', () => {
    expect(HashUtils.isHashValid('810f17077431ac21bf087c883f5b41dd391c1474bcd5e3fa46cb26e2d196c1')).toBeFalsy();
  });
});
