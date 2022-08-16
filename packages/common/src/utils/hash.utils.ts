
export class HashUtils {
    static isHashValid(hash: string): boolean {
        if (hash.length === 64) {
            return true;
        }
        return false;
    }
}
