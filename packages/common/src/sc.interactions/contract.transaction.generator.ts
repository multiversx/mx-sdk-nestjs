import {
  Abi,
  Address,
  ContractExecuteInput,
  INetworkProvider,
  NetworkConfig,
  SmartContractTransactionsFactory,
  Transaction,
  TransactionsFactoryConfig,
} from "@multiversx/sdk-core";
import { OriginLogger } from "../utils/origin.logger";

export class ContractTransactionGenerator {
  private readonly logger = new OriginLogger(ContractTransactionGenerator.name);
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
      this.logger.log(`Unexpected error when trying to load network config`);
      this.logger.error(error);

      throw new Error("Error when loading network config");
    }
  }

  private async getNetworkConfig(): Promise<NetworkConfig> {
    if (!this.networkConfig) {
      this.networkConfig = await this.loadNetworkConfig();
    }

    return this.networkConfig;
  }

  async createTransaction(
    input: ContractExecuteInput,
    signerAddress: Address,
    abi?: Abi
  ): Promise<Transaction> {
    try {
      const factory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: this.networkConfig?.chainID ?? "D",
        }),
        abi: abi,
      });

      const transaction = factory.createTransactionForExecute(
        signerAddress,
        input
      );
      const signerAccount = await this.proxy.getAccount(signerAddress);
      transaction.nonce = signerAccount.nonce;

      const networkConfig: NetworkConfig = await this.getNetworkConfig();
      transaction.chainID = networkConfig.chainID;

      return transaction;
    } catch (error) {
      this.logger.log(
        `Unexpected error when trying to create transaction '${
          input.contract
        }' to contract '${input.contract.toBech32()}'`
      );
      this.logger.error(error);

      throw error;
    }
  }
}
