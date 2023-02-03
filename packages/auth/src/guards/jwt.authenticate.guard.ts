import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TokenExpiredError, verify } from 'jsonwebtoken';
import { JwtConfig } from './models/jwt-config';

@Injectable()
export class JwtAuthenticateGuard implements CanActivate {
  constructor(
    private readonly jwtConfig: JwtConfig
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
      const jwtSecret = this.jwtConfig.secret;

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
      if (error instanceof TokenExpiredError) {
        return false;
      }

      return false;
    }

    return true;
  }
}
