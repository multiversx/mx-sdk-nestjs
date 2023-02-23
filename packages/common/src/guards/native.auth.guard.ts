import { NativeAuthError, NativeAuthServer } from '@multiversx/sdk-native-auth-server';
import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { NoAuthOptions } from '../decorators';
import { DecoratorUtils } from '../utils/decorator.utils';
import { CachingService } from '../common/caching/caching.service';
import { ErdnestConfigService } from '../common/config/erdnest.config.service';
import { ERDNEST_CONFIG_SERVICE } from '../utils/erdnest.constants';
import { NativeAuthInvalidOriginError } from './errors/native.auth.invalid.origin.error';

/**
 * This Guard protects all routes that do not have the `@NoAuth` decorator and sets the `X-Native-Auth-*` HTTP headers.
 *
 * @return {boolean} `canActivate` returns true if the Authorization header is a valid Native-Auth token.
 */
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
    const noAuthMetadata = DecoratorUtils.getMethodDecorator(NoAuthOptions, context.getHandler());
    if (noAuthMetadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const origin = request.headers['origin'];

    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }

    const jwt = authorization.replace('Bearer ', '');

    try {
      const userInfo = await this.authServer.validate(jwt);
      if (origin !== userInfo.origin && origin !== 'https://' + userInfo.origin) {
        throw new NativeAuthInvalidOriginError(userInfo.origin, origin);
      }

      request.res.set('X-Native-Auth-Issued', userInfo.issued);
      request.res.set('X-Native-Auth-Expires', userInfo.expires);
      request.res.set('X-Native-Auth-Address', userInfo.address);
      request.res.set('X-Native-Auth-Timestamp', Math.round(new Date().getTime() / 1000));

      request.nativeAuth = userInfo;
      request.jwt = userInfo;
      return true;
    } catch (error) {
      if (error instanceof NativeAuthError) {
        // @ts-ignore
        const message = error?.message;
        if (message) {
          request.res.set('X-Native-Auth-Error-Type', error.constructor.name);
          request.res.set('X-Native-Auth-Error-Message', message);
        }
      }

      return false;
    }
  }
}
