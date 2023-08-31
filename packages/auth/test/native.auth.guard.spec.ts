import { NativeAuthGuard } from "../src/native.auth.guard";

describe('getOrigin', () => {
  it('origin tests', () => {
    expect(NativeAuthGuard.getOrigin({ origin: 'https://localhost:3001' })).toStrictEqual('https://localhost:3001');
    expect(NativeAuthGuard.getOrigin({ origin: 'https://api.multiversx.com' })).toStrictEqual('https://api.multiversx.com');
    expect(NativeAuthGuard.getOrigin({ origin: 'http://localhost' })).toStrictEqual('http://localhost');
  });

  it('referer tests', () => {
    expect(NativeAuthGuard.getOrigin({ referer: 'https://localhost:3001/' })).toStrictEqual('https://localhost:3001');
    expect(NativeAuthGuard.getOrigin({ referer: 'http://localhost:3001/helloworld' })).toStrictEqual('http://localhost:3001');
  });
});
