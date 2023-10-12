import { UrlUtils } from "../../src/utils/url.utils";

describe('isLocalhost', () => {
  it('should return true', () => {
    expect(UrlUtils.isLocalhost('https://localhost:2000')).toBeTruthy();
    expect(UrlUtils.isLocalhost('http://localhost:2000')).toBeTruthy();
  });

  it('should return false', () => {
    expect(UrlUtils.isLocalhost('multiversx.com')).toBeFalsy();
    expect(UrlUtils.isLocalhost('http://multiversx.com')).toBeFalsy();
    expect(UrlUtils.isLocalhost('https://multiversx.com')).toBeFalsy();
  });
});
