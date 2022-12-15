import { NativeAuthServer } from '@elrondnetwork/native-auth-server';
import { Injectable, CanActivate, ExecutionContext, Optional, Inject } from '@nestjs/common';
import { OriginLogger } from '../utils/origin.logger';
import { CachingService } from '../common/caching/caching.service';
import { ElrondCachingService } from '../common/caching/elrond-caching/elrond-caching.service';
import { ERDNEST_CONFIG_SERVICE } from '../utils/erdnest.constants';
import { ErdnestConfigService } from '../common/config/erdnest.config.service';

export interface NativeAuthGuardOptions {
  apiUrl?: string;
  acceptedHosts?: string[];
  maxExpirySeconds?: number;
}

@Injectable()
export class NativeAuthGuard implements CanActivate {
  private readonly logger = new OriginLogger(NativeAuthGuard.name);
  private readonly authServer: NativeAuthServer;

  constructor(
    @Inject(ERDNEST_CONFIG_SERVICE) erdnestConfigService: ErdnestConfigService,
    @Optional() cachingService?: CachingService,
    @Optional() elrondCachingService?: ElrondCachingService,
  ) {
    this.authServer = new NativeAuthServer({
      ...erdnestConfigService.getNativeAuthGuardOptions(),
      cache: {
        getValue: async function <T>(key: string): Promise<T | undefined> {
          if (key === 'block:timestamp:latest') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new Date().getTime() / 1000;
          }

          if (elrondCachingService) {
            return await elrondCachingService.get<T>(key);
          }

          if (cachingService) {
            return await cachingService.getCache<T>(key);
          }

          throw new Error('CachingService or ElrondCachingService is not available in the context');
        },
        setValue: async function <T>(key: string, value: T, ttl: number): Promise<void> {
          if (elrondCachingService) {
            return await elrondCachingService.set<T>(key, value, ttl);
          }

          if (cachingService) {
            await cachingService.setCache<T>(key, value, ttl);
            return;
          }

          throw new Error('CachingService or ElrondCachingService is not available in the context');
        },
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();

      const host = new URL(request.headers['origin']).hostname;

      const authorization: string = request.headers['authorization'];
      if (!authorization) {
        return false;
      }
      const jwt = authorization.replace('Bearer ', '');

      const userInfo = await this.authServer.validate(jwt);
      if (userInfo.host !== host) {
        this.logger.error(`Invalid host '${userInfo.host}'. should be '${host}'`);
        return false;
      }

      request.res.set('X-Native-Auth-Issued', userInfo.issued);
      request.res.set('X-Native-Auth-Expires', userInfo.expires);
      request.res.set('X-Native-Auth-Address', userInfo.address);
      request.res.set('X-Native-Auth-Timestamp', Math.round(new Date().getTime() / 1000));

      request.nativeAuth = userInfo;

      return true;
    } catch (error) {
      this.logger.error(error);

      return false;
    }
  }
}
