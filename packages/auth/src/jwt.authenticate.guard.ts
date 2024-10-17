import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { PerformanceProfiler } from '@multiversx/sdk-nestjs-monitoring';
import { MxnestConfigService, MXNEST_CONFIG_SERVICE, DecoratorUtils, ExecutionContextUtils } from '@multiversx/sdk-nestjs-common';
import { NoAuthOptions } from './decorators/no.auth';

@Injectable()
export class JwtAuthenticateGuard implements CanActivate {
  constructor(
    @Inject(MXNEST_CONFIG_SERVICE)
    private readonly mxnestConfigService: MxnestConfigService
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const noAuthMetadata = DecoratorUtils.getMethodDecorator(NoAuthOptions, context.getHandler());
    if (noAuthMetadata) {
      return true;
    }

    const headers = ExecutionContextUtils.getHeaders(context);
    const request = ExecutionContextUtils.getRequest(context);

    const authorization: string = headers['authorization'];
    if (!authorization) {
      return false;
    }

    const jwt = authorization.replace('Bearer ', '');
    const profiler = new PerformanceProfiler();

    try {
      const jwtSecret = this.mxnestConfigService.getJwtSecret();

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
      // @ts-ignore
      const message = error?.message;
      if (message) {
        profiler.stop();

        request.res.set('X-Jwt-Auth-Error-Type', error.constructor.name);
        request.res.set('X-Jwt-Auth-Error-Message', message);
        request.res.set('X-Jwt-Auth-Duration', profiler.duration);
      }

      return false;
    }

    return true;
  }
}
