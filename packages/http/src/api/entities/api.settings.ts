import { NativeAuthSigner } from "@multiversx/sdk-nestjs-auth";

export class ApiSettings {
  timeout?: number;
  skipRedirects?: boolean;
  responseType?: 'arraybuffer' | 'json';
  headers?: Record<string, string>;
  nativeAuthSigner?: NativeAuthSigner;
}
