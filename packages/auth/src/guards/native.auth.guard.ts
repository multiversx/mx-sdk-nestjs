import { NativeAuthServer } from '@multiversx/sdk-native-auth-server';
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { NativeAuthConfig } from '../models';

@Injectable()
export class NativeAuthGuard implements CanActivate {
  private readonly authServer: NativeAuthServer;

  constructor(
    private readonly nativeAuthConfig: NativeAuthConfig
  ) {
    this.authServer = new NativeAuthServer({
      apiUrl: this.nativeAuthConfig.apiUrl,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const host = new URL(request.headers['origin']).hostname;

    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }
    const jwt = authorization.replace('Bearer ', '');

    try {
      const userInfo = await this.authServer.validate(jwt);
      if (userInfo.host !== host) {
        return false;
      }

      request.res.set('X-Native-Auth-Issued', userInfo.issued);
      request.res.set('X-Native-Auth-Expires', userInfo.expires);
      request.res.set('X-Native-Auth-Address', userInfo.address);
      request.res.set('X-Native-Auth-Timestamp', Math.round(new Date().getTime() / 1000));

      request.nativeAuth = userInfo;
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
