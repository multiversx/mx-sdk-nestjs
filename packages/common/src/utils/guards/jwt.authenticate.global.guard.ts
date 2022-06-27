import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { TokenExpiredError, verify } from 'jsonwebtoken';
import configuration from "../../../config/configuration";

@Injectable()
export class JwtAuthenticateGlobalGuard implements CanActivate {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(JwtAuthenticateGlobalGuard.name);
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
      const jwtSecret: string = configuration()['security.jwtSecret'];

      const accessAddress = await new Promise((resolve, reject) => {
        verify(jwt, jwtSecret, (err, decoded) => {
          if (err) {
            reject(err);
          }

          // @ts-ignore
          resolve(decoded.accessAddress);
        });
      });

      if (accessAddress !== configuration()['security.accessAddress']) {
        return false;
      }
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
