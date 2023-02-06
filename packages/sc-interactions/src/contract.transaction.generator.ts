
import { NetworkConfig } from "@multiversx/sdk-network-providers";
import { INetworkProvider } from "@multiversx/sdk-network-providers/out/interface";
import { Interaction, IAddress, Transaction } from "@multiversx/sdk-core";

export class ContractTransactionGenerator {
  private readonly proxy: INetworkProvider;
  private networkConfig: NetworkConfig | undefined = undefined;

  constructor(proxy: INetworkProvider) {
    this.proxy = proxy;
  }

  private async loadNetworkConfig(): Promise<NetworkConfig> {
    try {
      const networkConfig: NetworkConfig = await this.proxy.getNetworkConfig();

      return networkConfig;
    } catch (error) {
      throw new Error('Error when loading network config');
    }
  }

  private async getNetworkConfig(): Promise<NetworkConfig> {
    if (!this.networkConfig) {
      this.networkConfig = await this.loadNetworkConfig();
    }

    return this.networkConfig;
  }

  async createTransaction(interaction: Interaction, signerAddress: IAddress): Promise<Transaction> {
    const transaction: Transaction = interaction.buildTransaction();

    const signerAccount = await this.proxy.getAccount(signerAddress);
    transaction.setNonce(signerAccount.nonce.valueOf());

    const networkConfig: NetworkConfig = await this.getNetworkConfig();
    transaction.setChainID(networkConfig.ChainID);

    return transaction;
  }
}
