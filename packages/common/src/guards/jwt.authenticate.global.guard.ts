import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { TokenExpiredError, verify } from 'jsonwebtoken';
import { OriginLogger } from "../utils/origin.logger";
import { ErdnestConfigService } from "../common/config/erdnest.config.service";
import { NoAuthOptions } from "../decorators/no.auth";
import { DecoratorUtils } from "../utils/decorator.utils";
import { ERDNEST_CONFIG_SERVICE } from "../utils/erdnest.constants";

@Injectable()
export class JwtAuthenticateGlobalGuard implements CanActivate {
  private readonly logger = new OriginLogger(JwtAuthenticateGlobalGuard.name);

  constructor(
    @Inject(ERDNEST_CONFIG_SERVICE)
    private readonly erdnestConfigService: ErdnestConfigService
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const noAuthMetadata = DecoratorUtils.getMethodDecorator(NoAuthOptions, context.getHandler());
    if (noAuthMetadata) {
      return true;
    }

    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }

    const jwt = authorization.replace('Bearer ', '');

    try {
      const jwtSecret: string = this.erdnestConfigService.getJwtSecret();

      await new Promise((resolve, reject) => {
        verify(jwt, jwtSecret, (err, decoded) => {
          if (err) {
            reject(err);
          }

          // @ts-ignore
          resolve(decoded.accessAddress);
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
