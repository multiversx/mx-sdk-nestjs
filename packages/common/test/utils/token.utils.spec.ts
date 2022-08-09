import { TokenUtils } from "../../src/utils/token.utils";

describe('isToken', () => {
    it('Check isToken function', () => {
      expect(TokenUtils.isToken('MEX-455c57')).toBeTruthy();
      expect(TokenUtils.isToken('EWLD-e23800-455c74')).toBeFalsy();
    });
  });

  describe('isCollection', () => {
    it('Check isCollection function', () => {
      expect(TokenUtils.isCollection('MOS-b9b4b2')).toBeTruthy();
      expect(TokenUtils.isCollection('MOS-b9b4b2-455c74')).toBeFalsy();
    });
  });

  describe('isNft', () => {
    it('Check isNft function', () => {
      expect(TokenUtils.isNft('MOS-b9b4b2-947a3912')).toBeTruthy();
      expect(TokenUtils.isNft('MOS-b9b4b2')).toBeFalsy();
    });
  });
