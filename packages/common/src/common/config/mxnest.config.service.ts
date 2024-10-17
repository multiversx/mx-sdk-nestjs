export interface MxnestConfigService {
  getSecurityAdmins(): string[];

  getJwtSecret(): string;

  getApiUrl(): string;

  getNativeAuthMaxExpirySeconds(): number;

  getNativeAuthAcceptedOrigins(): string[];
}
