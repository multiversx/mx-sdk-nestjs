import { IContractQuery } from "@multiversx/sdk-core/out/networkProviders/interface";
import { AccountOnNetwork, IAddress, ContractQueryResponse, NetworkConfig } from "@multiversx/sdk-core";

export interface INetworkProvider {
    /**
     * Fetches the Network configuration.
     */
    getNetworkConfig(): Promise<NetworkConfig>;

    /**
     * Fetches the state of an account.
     */
    getAccount(address: IAddress): Promise<AccountOnNetwork>;

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    queryContract(query: IContractQuery): Promise<ContractQueryResponse>;
}
