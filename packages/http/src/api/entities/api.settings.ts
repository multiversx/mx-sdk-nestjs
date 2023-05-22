import { NativeAuthSigner } from "../../auth/native.auth.signer";

export interface ApiSettingsBasicCredentials {
  username: string;
  password: string;
}

export class ApiSettings {
  timeout?: number;
  skipRedirects?: boolean;
  responseType?: 'arraybuffer' | 'json';
  headers?: Record<string, string>;
  auth?: ApiSettingsBasicCredentials;
  nativeAuthSigner?: NativeAuthSigner;
}
