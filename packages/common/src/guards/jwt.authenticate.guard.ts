import { Injectable, CanActivate, ExecutionContext, Logger, Inject } from '@nestjs/common';
import { TokenExpiredError, verify } from 'jsonwebtoken';
import { NESTJS_API_CONFIG_SERVICE } from '../utils/nestjs.microservice.constants';
import { NestjsApiConfigService } from '../common/api-config/nestjs.api.config.service';

@Injectable()
export class JwtAuthenticateGuard implements CanActivate {
  private readonly logger: Logger;

  constructor(
    @Inject(NESTJS_API_CONFIG_SERVICE)
    private readonly apiConfigService: NestjsApiConfigService
  ) {
    this.logger = new Logger(JwtAuthenticateGuard.name);
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }

    const jwt = authorization.replace('Bearer ', '');

    try {
      const jwtSecret = this.apiConfigService.getJwtSecret();

      request.jwt = await new Promise((resolve, reject) => {
        verify(jwt, jwtSecret, (err: any, decoded: any) => {
          if (err) {
            reject(err);
          }

          // @ts-ignore
          resolve(decoded.user);
        });
      });

    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return false;
      }

      this.logger.error(error);
      return false;
    }

    return true;
  }
}
