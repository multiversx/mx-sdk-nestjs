import { Address, SmartContract } from "@elrondnetwork/erdjs/out";
import { ContractLoader } from "../../src/sc.interactions/contract.loader";

describe("Contract loader", () => {
  const CONTRACT_ADDRESS = "erd1qqqqqqqqqqqqqpgqkdz87p5raf5tsyv66ld8cu49nf2dqpp9d8ss36ltf2";
  const ABI_PATH: string = 'src/abis/metabonding.abi.json';
  const CONTRACT_INTERFACE: string = 'Metabonding';
  const contractLoader: ContractLoader = new ContractLoader(ABI_PATH, CONTRACT_INTERFACE, CONTRACT_ADDRESS);

  it('Should load metabonding contract', async () => {
    const contract: SmartContract = await contractLoader.getContract();

    expect(contract.getAddress().bech32()).toStrictEqual(CONTRACT_ADDRESS);
  });

  it('Should load contract from memory once', async () => {
    const cLoader = new ContractLoader(ABI_PATH, CONTRACT_INTERFACE, CONTRACT_ADDRESS);

    const loadSpy = jest
      .spyOn(ContractLoader.prototype as any, 'load')
      // eslint-disable-next-line require-await
      .mockImplementation(jest.fn(async () => new SmartContract({ address: new Address(CONTRACT_ADDRESS) })));

    await cLoader.getContract();

    expect(loadSpy).toHaveBeenCalled();
    expect(loadSpy.mock.calls.length).toStrictEqual(1);

    await cLoader.getContract();
    expect(loadSpy.mock.calls.length).toStrictEqual(1);
  });

  it('Should throw error, abi path is invalid', async () => {
    const cLoader = new ContractLoader("./invalid-path", CONTRACT_INTERFACE, CONTRACT_ADDRESS);

    await expect(cLoader.getContract()).rejects.toThrow(Error);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
