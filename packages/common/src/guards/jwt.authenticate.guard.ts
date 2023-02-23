import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { PerformanceProfiler } from 'src/utils/performance.profiler';
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
    const profiler = new PerformanceProfiler();

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
