import { BinaryUtils } from "../../src/utils/binary.utils";

describe('Binary Utils', () => {
  describe('Based64Encode', () => {
    it('Convert string to base64 encode', () => {
      expect(BinaryUtils.base64Encode('AliceRob')).toStrictEqual('QWxpY2VSb2I=');
    });
    it('Convert string to binary', () => {
      expect(BinaryUtils.base64Decode('QWxpY2VSb2I=')).toStrictEqual('AliceRob');
    });
    it('Convert based64 to hex', () => {
      expect(BinaryUtils.base64ToHex('QWxpY2VSb2I=')).toStrictEqual('416c696365526f62');
    });
    it('Convert string to hex', () => {
      expect(BinaryUtils.stringToHex('aliceRob')).toStrictEqual('616c696365526f62');
    });
    it('Convert hex to number', () => {
      expect(BinaryUtils.hexToNumber('616c69636552')).toStrictEqual(107118252483922);
    });
    it('Convert tryBase64 to address', () => {
      expect(BinaryUtils.tryBase64ToAddress('erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p')).toBeUndefined();
    });
    it('Convert String to padHex', () => {
      expect(BinaryUtils.padHex('alice')).toStrictEqual('0alice');
      expect(BinaryUtils.padHex('aliceRob')).toStrictEqual('aliceRob');
    });
    it('Convert hex to string', () => {
      expect(BinaryUtils.hexToString('616c696365526f62')).toStrictEqual('aliceRob');
    });

    it('Convert TryBase64 to hex', () => {
      expect(BinaryUtils.tryBase64ToHex('aliceRob')).toStrictEqual('6a589c791a1b');
    });
  });

  describe('base64ToBigInt', () => {
    it('should return correct BigInt for a valid base64 string', () => {
      BinaryUtils.base64ToHex = jest.fn().mockReturnValue('1f');

      const result = BinaryUtils.base64ToBigInt('Gw==');
      expect(result).toEqual(BigInt('31'));
    });

    it('should return BigInt(0) for an empty string', () => {
      BinaryUtils.base64ToHex = jest.fn().mockReturnValue('');

      const result = BinaryUtils.base64ToBigInt('');
      expect(result).toEqual(BigInt(0));
    });

    it('should return BigInt(0) for a base64 string that translates to empty hex', () => {
      BinaryUtils.base64ToHex = jest.fn().mockReturnValue('');

      const result = BinaryUtils.base64ToBigInt('AA==');
      expect(result).toEqual(BigInt(0));
    });
  });
});
