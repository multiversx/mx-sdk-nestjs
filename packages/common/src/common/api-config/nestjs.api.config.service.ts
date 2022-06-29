export interface NestjsApiConfigService {
  getSecurityAdmins(): string[];

  getJwtSecret(): string;

  getAccessAddress(): string
}
