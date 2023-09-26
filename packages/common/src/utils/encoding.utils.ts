import { Address } from '@multiversx/sdk-core';
import BigNumber from 'bignumber.js';
import * as crypto from 'crypto';

export class EncodingUtils {
  static sha256Encode(input: string): string {
    return crypto
      .createHash('sha256')
      .update(input)
      .digest('hex');
  }

  static stringToHex(input: string): string {
    return Buffer.from(input, 'utf8').toString('hex');
  }

  static hexToString(input: string): string {
    return Buffer.from(input, 'hex').toString('utf-8');
  }

  static base64Encode(input: string): string {
    return Buffer.from(input, 'utf8').toString('base64');
  }

  static base64Decode(
    input: string | undefined | null,
  ): string | undefined {
    if (input == null) {
      return;
    }
    return Buffer.from(input, 'base64').toString('utf-8');
  }

  static bech32ToHex(input: string): string {
    return new Address(input).hex();
  }

  static base64ToHex(input: string): string {
    return Buffer.from(input, 'base64').toString('hex');
  }

  static hexToDecimalString(input: string): string {
    return new BigNumber(input, 16).toString(10);
  }

  static base64ToDecimalString(input: string): string {
    if (input === '') {
      return '0';
    }

    const hex = EncodingUtils.base64ToHex(input);
    return EncodingUtils.hexToDecimalString(hex);
  }

  static hexToBech32(input: string): string {
    return Address.fromHex(input).bech32();
  }

  static hexToBech32Safe(input: string): string | undefined {
    try {
      return Address.fromHex(input).bech32();
    } catch {
      return;
    }
  }

  static hexToBase64(input: string): string {
    return Buffer.from(input, 'hex').toString('base64');
  }

  static saltSha256Encode(
    input: string,
    salt: string,
  ): string {
    return crypto
      .createHmac('sha256', salt)
      .update(input)
      .digest('hex');
  }
}
