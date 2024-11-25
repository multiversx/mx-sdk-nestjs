
import { ContractQueryResponse, ApiNetworkProvider } from "@multiversx/sdk-core";
import { ResultsParser, SmartContract, Interaction, TypedOutcomeBundle } from "@multiversx/sdk-core";
import { OriginLogger } from "../utils/origin.logger";

export class ContractQueryRunner {
  private readonly logger = new OriginLogger(ContractQueryRunner.name);
  private readonly proxy: ApiNetworkProvider;
  private readonly parser: ResultsParser = new ResultsParser();

  constructor(proxy: ApiNetworkProvider) {
    this.proxy = proxy;
  }

  async runQuery(contract: SmartContract, interaction: Interaction): Promise<TypedOutcomeBundle> {
    try {
      const queryResponse: ContractQueryResponse = await this.proxy.queryContract(interaction.buildQuery());

      return this.parser.parseQueryResponse(queryResponse, interaction.getEndpoint());
    } catch (error) {
      this.logger.log(`Unexpected error when running query '${interaction.buildQuery().func}' to sc '${contract.getAddress().bech32()}' `);
      this.logger.error(error);

      throw error;
    }
  }
}
