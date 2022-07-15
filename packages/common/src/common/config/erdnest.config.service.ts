export interface ErdnestConfigService {
  getSecurityAdmins(): string[];

  getJwtSecret(): string;
}
