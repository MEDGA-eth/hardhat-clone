import { cloneContract, createTestFixture, TIMEOUT } from './helpers';
import fs from 'node:fs';

describe('hardhat-clone clones unverified contracts', () => {
  it.concurrent.each([
    ['0x123', 'Invalid address'],
    ['0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263', 'NotVerified'],
    ['0xFf23e40ac05D30Df46c250Dd4d784f6496A79CE9', 'Vyper contracts'],
  ])(
    `should clone %s (%s)`,
    async (
      contractAddress: string,
      errorMsg: string,
      opts?: {
        etherscanApiKey?: string;
        debug?: boolean; // whether to print logs and preserve the temp project for debugging
      },
    ) => {
      const tmp = await createTestFixture(opts);
      const task = cloneContract(tmp, contractAddress, 'unverified', opts);
      await expect(task).rejects.toThrow(errorMsg);

      if (!opts?.debug)
        await fs.promises.rm(tmp, { recursive: true, force: true });
    },
    TIMEOUT,
  );
});
