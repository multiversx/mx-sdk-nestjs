import { AbiRegistry, Address, SmartContract, SmartContractAbi } from "@elrondnetwork/erdjs/out";
import { Logger } from "@nestjs/common";
import * as fs from "fs";

export class ContractLoader {
  private readonly logger: Logger;
  private readonly abiPath: string;
  private readonly contractInterface: string;
  private readonly contractAddress: string;
  private contract: SmartContract | undefined = undefined;

  constructor(abiPath: string, contractInterface: string, contractAddres: string) {
    this.abiPath = abiPath;
    this.contractInterface = contractInterface;
    this.contractAddress = contractAddres;

    this.logger = new Logger(ContractLoader.name);
  }

  private async load(): Promise<SmartContract> {
    try {
      const jsonContent: string = await fs.promises.readFile(this.abiPath, { encoding: "utf8" });
      const json = JSON.parse(jsonContent);

      const abiRegistry = AbiRegistry.create(json);

      const abi = new SmartContractAbi(abiRegistry, [this.contractInterface]);

      return new SmartContract({
        address: new Address(this.contractAddress),
        abi: abi,
      });
    } catch (error) {
      this.logger.log(`Unexpected error when trying to create smart contract from abi`);
      this.logger.error(error);

      throw new Error('Error when creating contract from abi');
    }
  }

  async getContract(): Promise<SmartContract> {
    if (!this.contract) {
      this.contract = await this.load();
    }

    return this.contract;
  }
}
