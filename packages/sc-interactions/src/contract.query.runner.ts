
import { ContractQueryResponse } from "@multiversx/sdk-network-providers";
import { INetworkProvider } from "@multiversx/sdk-network-providers/out/interface";
import { ResultsParser, Interaction, TypedOutcomeBundle } from "@multiversx/sdk-core";

export class ContractQueryRunner {
  private readonly proxy: INetworkProvider;
  private readonly parser: ResultsParser = new ResultsParser();

  constructor(proxy: INetworkProvider) {
    this.proxy = proxy;
  }

  async runQuery(interaction: Interaction): Promise<TypedOutcomeBundle> {
    const queryResponse: ContractQueryResponse = await this.proxy.queryContract(interaction.buildQuery());

    return this.parser.parseQueryResponse(queryResponse, interaction.getEndpoint());
  }
}
