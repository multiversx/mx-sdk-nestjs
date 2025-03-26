import { UserSigner } from "@multiversx/sdk-core";
import { NativeAuthSigner } from "../src/auth";

describe("NativeAuthSigner", () => {
  let nativeAuthSigner: NativeAuthSigner;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an existing token if it's still valid", async () => {
    const mockToken = "dummyToken";
    const mockExpiryDate = new Date();
    mockExpiryDate.setMinutes(mockExpiryDate.getMinutes() + 5); // Token still valid

    nativeAuthSigner = new NativeAuthSigner({});
    nativeAuthSigner["accessTokenInfo"] = {
      token: mockToken,
      expiryDate: mockExpiryDate,
    };

    const tokenInfo = await nativeAuthSigner.getToken();
    expect(tokenInfo.token).toBe(mockToken);
    expect(tokenInfo.expiryDate).toBe(mockExpiryDate);
  });

  it("should generate a new token if the existing one has expired", async () => {
    const expiredDate = new Date();
    expiredDate.setMinutes(expiredDate.getMinutes() - 5); // Token expired

    const mockToken = "newDummyToken";
    const mockSignerAddress = "dummySignerAddress";
    const mockSignature = Buffer.from("dummySignature");
    const mockSignableToken = "dummySignableToken";

    nativeAuthSigner = new NativeAuthSigner({});
    nativeAuthSigner["accessTokenInfo"] = {
      token: "expiredToken",
      expiryDate: expiredDate,
    };

    jest.spyOn(nativeAuthSigner as any, "getUserSigner").mockResolvedValue({
      getAddress: () => ({ toBech32: () => mockSignerAddress }),
      sign: jest.fn().mockResolvedValue(mockSignature),
    } as unknown as UserSigner);
    jest
      .spyOn(nativeAuthSigner as any, "getSignableToken")
      .mockResolvedValue(mockSignableToken);
    jest
      .spyOn(nativeAuthSigner["nativeAuthClient"], "getToken")
      .mockReturnValue(mockToken);

    const tokenInfo = await nativeAuthSigner.getToken();

    expect(tokenInfo.token).toBe(mockToken);
    expect(tokenInfo.expiryDate.getTimeInSeconds()).toBeGreaterThan(
      new Date().getTimeInSeconds()
    );
  });

  it("should throw an error if private key and key path are missing", async () => {
    nativeAuthSigner = new NativeAuthSigner({});
    await expect(nativeAuthSigner["getUserSigner"]()).rejects.toThrow(
      "Missing PrivateKey and SignerPrivateKeyPath in NativeAuthSigner."
    );
  });

  it("should generate the correct signable message", () => {
    nativeAuthSigner = new NativeAuthSigner({});

    const mockSignerAddress = "dummySignerAddress";
    const mockSignableToken = "dummySignableToken";
    const expectedMessage = `${mockSignerAddress}${mockSignableToken}`;

    const signableMessage = nativeAuthSigner["getMessage"](
      mockSignerAddress,
      mockSignableToken
    );

    expect(signableMessage.data.toString()).toBe(expectedMessage);
  });
});
