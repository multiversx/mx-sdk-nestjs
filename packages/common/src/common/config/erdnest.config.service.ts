import { NativeAuthGuardOptions } from "../../guards/native.auth.guard";

export interface ErdnestConfigService {
  getSecurityAdmins(): string[];

  getJwtSecret(): string;

  getNativeAuthGuardOptions(): NativeAuthGuardOptions | undefined;
}
