export class UrlUtils {
  static isLocalhost(url: string): boolean {
    try {
      const requestUrl = new URL(url);
      return requestUrl.hostname === 'localhost';
    } catch {
      return false;
    }
  }
}
