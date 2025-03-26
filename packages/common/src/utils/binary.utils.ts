import { AddressUtils } from "./address.utils";

function base64DecodeBinary(str: string): Buffer {
  return Buffer.from(str, "base64");
}

export class BinaryUtils {
  static base64Encode(str: string) {
    return Buffer.from(str).toString("base64");
  }

  static base64Decode(str: string): string {
    return base64DecodeBinary(str).toString("binary");
  }

  static tryBase64ToBigInt(str: string): BigInt | undefined {
    try {
      return this.base64ToBigInt(str);
    } catch {
      return undefined;
    }
  }

  static base64ToBigInt(str: string): BigInt {
    const hex = this.base64ToHex(str);
    return BigInt(hex ? "0x" + hex : hex);
  }

  static tryBase64ToHex(str: string): string | undefined {
    try {
      return this.base64ToHex(str);
    } catch {
      return undefined;
    }
  }

  static base64ToHex(str: string): string {
    return Buffer.from(str, "base64").toString("hex");
  }

  static stringToHex(str: string): string {
    return Buffer.from(str).toString("hex");
  }

  static tryBase64ToAddress(str: string): string | undefined {
    try {
      return this.base64ToAddress(str);
    } catch {
      return undefined;
    }
  }

  static base64ToAddress(str: string): string {
    return AddressUtils.bech32Encode(this.base64ToHex(str));
  }

  static hexToString(hex: string): string {
    return Buffer.from(hex, "hex").toString("ascii");
  }

  static hexToNumber(hex: string): number {
    return parseInt(hex, 16);
  }

  static hexToBase64(hex: string): string {
    return Buffer.from(hex, "hex").toString("base64");
  }

  static hexToBigInt(hex: string): BigInt {
    if (!hex) {
      return BigInt(0);
    }

    return BigInt("0x" + hex);
  }

  static padHex(value: string): string {
    return value.length % 2 ? "0" + value : value;
  }

  static numberToHex(value: number): string {
    return BinaryUtils.padHex(value.toString(16));
  }
}
