import {
  AccountOnNetwork,
  Address,
  ApiNetworkProvider,
  NetworkConfig,
} from "@multiversx/sdk-core";
import { ContractTransactionGenerator } from "../../src/sc.interactions/contract.transaction.generator";

const TEST_ADDRESS =
  "erd1wtm3yl58vcnj089lqy3tatkdpwklffh4pjnf27zwsa2znjyk355sutafqh";
describe("Contract transaction generator", () => {
  it("Should set transaction nonce", async () => {
    const cTxGenerator = new ContractTransactionGenerator(
      new ApiNetworkProvider("some-url")
    );

    const getAccountSpy = jest
      .spyOn(ApiNetworkProvider.prototype, "getAccount")
      // eslint-disable-next-line require-await
      .mockImplementation(
        jest.fn(
          async (_: Address) => new AccountOnNetwork({ nonce: BigInt(10) })
        )
      );

    const getNetworkConfigSpy = jest
      .spyOn(ApiNetworkProvider.prototype, "getNetworkConfig")
      // eslint-disable-next-line require-await
      .mockImplementation(jest.fn(async () => new NetworkConfig()));

    const tx = await cTxGenerator.createTransaction(
      {
        contract: new Address(TEST_ADDRESS),
        gasLimit: BigInt(20000000),
        function: "dummy",
      },
      new Address(TEST_ADDRESS)
    );

    expect(getAccountSpy).toHaveBeenCalled();
    expect(getNetworkConfigSpy).toHaveBeenCalled();

    expect(tx.nonce).toEqual(BigInt(10));
  });
});
