import { UserSigner } from "@elrondnetwork/erdjs-walletcore/out";
import { SignableMessage } from "@elrondnetwork/erdjs/out";
import { NativeAuthClient } from "@elrondnetwork/native-auth-client";
import { NativeAuthClientConfig } from "@elrondnetwork/native-auth-client/lib/src/entities/native.auth.client.config";
import { FileUtils } from "./file.utils";

export class NativeAuthSignerConfig extends NativeAuthClientConfig {
  signerPrivateKeyPath: string = '';
}

export class NativeAuthSigner {
  private readonly config: NativeAuthSignerConfig;

  constructor(config?: Partial<NativeAuthSignerConfig>) {
    this.config = Object.assign(new NativeAuthSignerConfig(), config);
  }

  public async getToken(): Promise<{ accessToken: string, expiryDate: Date }> {
    const pemFile = await FileUtils.readFile(this.config.signerPrivateKeyPath);
    const pemKey = pemFile.toString();

    const client = new NativeAuthClient(this.config);
    const signableToken = await client.initialize();
  
    const pem = UserSigner.fromPem(pemKey);

    const signerAddress = pem.getAddress().bech32();
  
    const messageToSign = `${signerAddress}${signableToken}{}`;
    const signableMessage = new SignableMessage({
      message: Buffer.from(messageToSign, 'utf8'),
    });
    await pem.sign(signableMessage);
  
    const signature = signableMessage.getSignature();
  
    const accessToken = client.getToken(signerAddress, signableToken, signature.hex());
    const expiryDate = new Date().addSeconds(this.config.expirySeconds);

    return { accessToken, expiryDate};
  }
}
