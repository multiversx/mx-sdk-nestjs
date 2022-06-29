import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NestjsApiConfigService {
  constructor(private readonly configService: ConfigService) { }

  getSecurityAdmins(): string[] {
    const admins = this.configService.get<string[]>('security.admins');
    if (admins === undefined) {
      throw new Error('No security admins value present');
    }

    return admins;
  }

  getJwtSecret(): string {
    const jwtSecret = this.configService.get<string>('security.jwtSecret');
    if (!jwtSecret) {
      throw new Error('No jwtSecret present');
    }

    return jwtSecret;
  }

  getAccessAddress(): string {
    return this.configService.get<string>('security.accessAddress') ?? '';
  }
}
