export class RegexUtils {
    static NFTIdentifier = /^[A-Z0-9]{3,10}-[a-f0-9]{6}-[a-f0-9]{2,}$/;
    static NFTCollection = /^[A-Z0-9]{3,10}-[a-f0-9]{6}$/;
    static ESDTIdentifier = /^[A-Z0-9]{3,10}-[a-f0-9]{6}$/;
    static Address = /^erd[a-z0-9]{59,59}$/;
    static AlphaCharacters = /^[a-zA-Z]*$/;
    static SHA256 = /[A-Fa-f0-9]{64}/;
    static FloatNumber = /^[0-9]+\.?[0-9]*$/;
    static HEX = /[a-f0-9]*/;
}
