import {
  Abi,
  INetworkProvider,
  SmartContractController,
  SmartContractQuery,
  SmartContractQueryResponse,
} from "@multiversx/sdk-core";
import { OriginLogger } from "../utils/origin.logger";

export class ContractQueryRunner {
  private readonly logger = new OriginLogger(ContractQueryRunner.name);
  private readonly proxy: INetworkProvider;

  constructor(proxy: INetworkProvider) {
    this.proxy = proxy;
  }

  async runQuery(
    query: SmartContractQuery,
    chainID: string,
    abi?: Abi
  ): Promise<SmartContractQueryResponse> {
    try {
      const controller = new SmartContractController({
        chainID: chainID,
        networkProvider: this.proxy,
        abi: abi,
      });
      const response = await controller.runQuery(query);

      return response;
    } catch (error) {
      this.logger.log(
        `Unexpected error when running query '${
          query.function
        }' to sc '${query.contract.toBech32()}' `
      );
      this.logger.error(error);

      throw error;
    }
  }
}
