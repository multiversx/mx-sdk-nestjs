export class TokenUtils {
  static tokenValidateRegex: RegExp = /^[A-Za-z0-9]{3,10}-[A-Za-z0-9]{3,10}-[A-Za-z0-9]{2,}$/;
  static nftValidateRegex: RegExp = /^[A-Za-z0-9]{3,10}-[a-fA-F0-9]{6}-[a-fA-F0-9]{2,}$/;

  static isToken(identifier: string): boolean {
    return this.tokenValidateRegex.test(identifier);
  }

  static isCollection(identifier: string): boolean {
    return this.tokenValidateRegex.test(identifier);
  }

  static isNft(identifier: string): boolean {
    return this.nftValidateRegex.test(identifier);
  }
}
