import { NativeAuthError, NativeAuthServer } from '@multiversx/sdk-native-auth-server';
import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { PerformanceProfiler } from 'src/utils/performance.profiler';
import { CachingService } from '../common/caching/caching.service';
import { ErdnestConfigService } from '../common/config/erdnest.config.service';
import { ERDNEST_CONFIG_SERVICE } from '../utils/erdnest.constants';
import { NativeAuthInvalidOriginError } from './errors/native.auth.invalid.origin.error';

@Injectable()
export class NativeAuthGuard implements CanActivate {
  private readonly authServer: NativeAuthServer;

  constructor(
    cachingService: CachingService,
    @Inject(ERDNEST_CONFIG_SERVICE)
    private readonly erdnestConfigService: ErdnestConfigService
  ) {
    this.authServer = new NativeAuthServer({
      apiUrl: this.erdnestConfigService.getApiUrl(),
      maxExpirySeconds: this.erdnestConfigService.getNativeAuthMaxExpirySeconds(),
      acceptedOrigins: this.erdnestConfigService.getNativeAuthAcceptedOrigins(),
      cache: {
        getValue: async function <T>(key: string): Promise<T | undefined> {
          if (key === 'block:timestamp:latest') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new Date().getTime() / 1000;
          }

          return await cachingService.getCache<T>(key);
        },
        setValue: async function <T>(key: string, value: T, ttl: number): Promise<void> {
          await cachingService.setCache(key, value, ttl);
        },
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const origin = request.headers['origin'];

    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }

    const jwt = authorization.replace('Bearer ', '');
    const profiler = new PerformanceProfiler();

    try {
      const userInfo = await this.authServer.validate(jwt);
      profiler.stop();

      if (origin !== userInfo.origin && origin !== 'https://' + userInfo.origin) {
        throw new NativeAuthInvalidOriginError(userInfo.origin, origin);
      }

      request.res.set('X-Native-Auth-Issued', userInfo.issued);
      request.res.set('X-Native-Auth-Expires', userInfo.expires);
      request.res.set('X-Native-Auth-Address', userInfo.address);
      request.res.set('X-Native-Auth-Timestamp', Math.round(new Date().getTime() / 1000));
      request.res.set('X-Native-Auth-Duration', profiler.duration);

      request.nativeAuth = userInfo;
      request.jwt = userInfo;
      return true;
    } catch (error) {
      if (error instanceof NativeAuthError) {
        // @ts-ignore
        const message = error?.message;
        if (message) {
          profiler.stop();
          request.res.set('X-Native-Auth-Error-Type', error.constructor.name);
          request.res.set('X-Native-Auth-Error-Message', message);
          request.res.set('X-Native-Auth-Duration', profiler.duration);
        }
      }

      return false;
    }
  }
}
