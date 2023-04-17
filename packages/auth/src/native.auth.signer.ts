import { NativeAuthClient } from '@multiversx/sdk-native-auth-client';
import { NativeAuthClientConfig } from '@multiversx/sdk-native-auth-client/lib/src/entities/native.auth.client.config';
import { UserSigner } from '@multiversx/sdk-wallet';
import { SignableMessage } from '@multiversx/sdk-core';
import { FileUtils } from '@multiversx/sdk-nestjs-common/lib/utils/file.utils';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/date.extensions';

export class NativeAuthSignerConfig extends NativeAuthClientConfig {
  signerPrivateKeyPath?: string | undefined = undefined;
  privateKey?: string | undefined = undefined;
}

export class AccessTokenInfo {
  token: string = '';
  expiryDate: Date = new Date(0);
}

export class NativeAuthSigner {
  private readonly config: NativeAuthSignerConfig;
  private readonly nativeAuthClient: NativeAuthClient;
  private userSigner?: UserSigner;
  private accessTokenInfo?: AccessTokenInfo;

  constructor(config: Partial<NativeAuthSignerConfig>) {
    this.config = Object.assign(new NativeAuthSignerConfig(), config);
    this.nativeAuthClient = new NativeAuthClient(this.config);
  }

  public async getToken(): Promise<AccessTokenInfo> {
    const currentDate = new Date().addMinutes(1);
    if (this.accessTokenInfo && currentDate <= this.accessTokenInfo.expiryDate) {
      return this.accessTokenInfo;
    }

    const userSigner = await this.getUserSigner();
    const signableToken = await this.getSignableToken();
    const signerAddress = userSigner.getAddress().bech32();

    const signableMessage = this.getSignableMessage(signerAddress, signableToken);

    // CHANGE HERE
    await userSigner.sign(signableMessage.message);

    const signature = signableMessage.getSignature();

    const token = this.nativeAuthClient.getToken(signerAddress, signableToken, signature.hex());
    const expiryDate = new Date().addSeconds(this.config.expirySeconds);

    return this.accessTokenInfo = {
      token,
      expiryDate,
    };
  }

  private async getUserSigner(): Promise<UserSigner> {
    if (this.userSigner) {
      return this.userSigner;
    }

    if (this.config.privateKey) {
      return this.userSigner = UserSigner.fromPem(this.config.privateKey);
    } else if (this.config.signerPrivateKeyPath) {
      const pemFile = await FileUtils.readFile(this.config.signerPrivateKeyPath);
      const pemKey = pemFile.toString();
      return this.userSigner = UserSigner.fromPem(pemKey);
    }

    throw new Error('Missing PrivateKey and SignerPrivateKeyPath in NativeAuthSigner.');
  }

  private getSignableToken(): Promise<string> {
    return this.nativeAuthClient.initialize();
  }

  private getSignableMessage(
    signerAddress: string,
    signableToken: string,
  ): SignableMessage {
    const messageToSign = `${signerAddress}${signableToken}`;
    return new SignableMessage({
      message: Buffer.from(messageToSign, 'utf8'),
    });
  }
}
