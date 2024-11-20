import { TokenUtils } from "../../src/utils/token.utils";

describe('isToken', () => {
    it('Check isToken function', () => {
      expect(TokenUtils.isToken('MEX-455c57')).toBeTruthy();
      expect(TokenUtils.isToken('sov-EWLD-455c74')).toBeTruthy();
      expect(TokenUtils.isToken('')).toBeFalsy();
      expect(TokenUtils.isToken('sov-')).toBeFalsy();
      expect(TokenUtils.isToken('sov-EWLD-455c74-00aa')).toBeFalsy();
      expect(TokenUtils.isToken('SOV-EWLD-455c74')).toBeFalsy();
      expect(TokenUtils.isToken('sov-sov-e23800-455c74')).toBeFalsy();
    });
  });

  describe('isCollection', () => {
    it('Check isCollection function', () => {
      expect(TokenUtils.isCollection('MOS-b9b4b2')).toBeTruthy();
      expect(TokenUtils.isCollection('sov-MOS-b9b4b2')).toBeTruthy();
      expect(TokenUtils.isCollection('')).toBeFalsy();
      expect(TokenUtils.isCollection('sov-')).toBeFalsy();
      expect(TokenUtils.isCollection('SOV-MOS-b9b4b2')).toBeFalsy();
      expect(TokenUtils.isCollection('sov-MOS-b9b4b2-455c74')).toBeFalsy();
    });
  });

  describe('isNft', () => {
    it('Check isNft function', () => {
      expect(TokenUtils.isNft('MOS-b9b4b2-947a3912')).toBeTruthy();
      expect(TokenUtils.isNft('sov-MOS-b9b4b2-947a3912')).toBeTruthy();
      expect(TokenUtils.isNft('')).toBeFalsy();
      expect(TokenUtils.isNft('sov-')).toBeFalsy();
      expect(TokenUtils.isNft('MOS-b9b4b2')).toBeFalsy();
      expect(TokenUtils.isNft('sov-MOS-b9b4b2')).toBeFalsy();
      expect(TokenUtils.isNft('SOV-MOS-b9b4b2')).toBeFalsy();
    });
  });

  describe('isSovereignIdentifier', () => {
    it('Check isSovereignIdentifier function', () => {
      expect(TokenUtils.isSovereignIdentifier('sov-MOS-b9b4b2-947a3912')).toBeTruthy();
      expect(TokenUtils.isSovereignIdentifier('sov-MOS-b9b4b2')).toBeTruthy();
      expect(TokenUtils.isSovereignIdentifier('')).toBeFalsy();
      expect(TokenUtils.isSovereignIdentifier('sov-')).toBeFalsy();
      expect(TokenUtils.isSovereignIdentifier('sov-MOS-b9b4b')).toBeFalsy();
      expect(TokenUtils.isSovereignIdentifier('SOV-MOS-b9b4b2-947a3912')).toBeFalsy();
      expect(TokenUtils.isSovereignIdentifier('SOV-MOS-b9b4b2')).toBeFalsy();
      expect(TokenUtils.isSovereignIdentifier('MOS-b9b4b2-947a3912')).toBeFalsy();
    });
  });
