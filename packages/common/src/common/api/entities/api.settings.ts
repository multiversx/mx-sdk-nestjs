import { NativeAuthSignerConfig } from "src/utils/native.auth.signer";

export class ApiSettings {
  timeout?: number;
  skipRedirects?: boolean;
  responseType?: 'arraybuffer' | 'json';
  headers?: Record<string, string>;
  nativeAuth?: NativeAuthSignerConfig;
  pendingRequests?: boolean = true;
}
