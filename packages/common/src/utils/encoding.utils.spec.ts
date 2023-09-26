import { EncodingUtils } from './encoding.utils';

describe('Encoding utils', () => {
  it('Salt sh256 encode', async () => {
    const tests = saltedHashTests;
    const errors: string[] = [];

    for (const test of tests) {
      try {
        // Act.
        const encodedString = EncodingUtils.saltSha256Encode(test.input, test.salt);
        // Assert.
        expect(encodedString).toEqual(test.result);
      } catch {
        errors.push(test.input);
      }
    }
    if (errors.length > 0) {
      throw new Error(`Salted sh256 encode - test failed for ${errors.join(', ')}.`);
    }
  });

  it('Base64 decode', async () => {
    const tests = base64DecodeTests;
    const errors: string[] = [];

    for (const test of tests) {
      try {
        // Act.
        const encodedString = EncodingUtils.base64Decode(test.input);
        // Assert.
        expect(encodedString).toEqual(test.result);
      } catch {
        errors.push(test.input);
      }
    }
    if (errors.length > 0) {
      throw new Error(`Base64 decode decode - test failed for ${errors.join(', ')}.`);
    }
  });
});

const saltedHashTests = [
  {
    input: '258651ba4f107186abf96444746d2b94756efd76f4d144e2d515bcac2b8d293d',
    salt: '298cfbfc-6032-4aaf-84ca-36b6b202bc3b',
    result: '56268d56922c810f1e80a4bcfbf262f251d9b9b01d5a9d87aedde174a2d5e2ab',
  },
];

const base64DecodeTests = [
  {
    input: 'cmVnaXN0ZXJANTYyNjhkNTY5MjJjODEwZjFlODBhNGJjZmJmMjYyZjI1MWQ5YjliMDFkNWE5ZDg3YWVkZGUxNzRhMmQ1ZTJhYg==',
    result: 'register@56268d56922c810f1e80a4bcfbf262f251d9b9b01d5a9d87aedde174a2d5e2ab',
  },
];
