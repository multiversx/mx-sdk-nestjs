export interface ErdnestConfigService {
  getSecurityAdmins(): string[];

  getJwtSecret(): string;

  getApiUrl(): string;

  getNativeAuthMaxExpirySeconds(): number;

  getNativeAuthAcceptedOrigins(): string[];
}
