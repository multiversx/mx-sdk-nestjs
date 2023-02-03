import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { ErdnestConfigService } from '../common/config/erdnest.config.service';
import { ERDNEST_CONFIG_SERVICE } from '../utils/erdnest.constants';

@Injectable()
export class JwtAuthenticateGuard implements CanActivate {
  constructor(
    @Inject(ERDNEST_CONFIG_SERVICE)
    private readonly erdnestConfigService: ErdnestConfigService
  ) { }

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
      const jwtSecret = this.erdnestConfigService.getJwtSecret();

      request.jwt = await new Promise((resolve, reject) => {
        verify(jwt, jwtSecret, (err: any, decoded: any) => {
          if (err) {
            reject(err);
          }

          // @ts-ignore
          resolve({
            ...decoded.user,
            ...decoded,
          });
        });
      });

    } catch (error) {
      return false;
    }

    return true;
  }
}
