import { cloneContract, createTestFixture, TIMEOUT } from './helpers';
import child_process from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('hardhat-clone clones multiple contracts', () => {
  it.concurrent.each([
    [
      [
        ['0xdAC17F958D2ee523a2206206994597C13D831ec7', 'Tether'],
        ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'USDC Proxy'],
      ],
    ],
    [
      [
        ['0x43506849D7C04F9138D1A2050bbF3A0c054402dd', 'USDC'],
        ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'WETH'],
        ['0xDb53f47aC61FE54F456A4eb3E09832D08Dd7BEec', 'withlibraries'],
      ],
    ],
  ])(
    `should clone %j`,
    async (
      contracts: string[][],
      opts?: {
        etherscanApiKey?: string;
        debug?: boolean; // whether to print logs and preserve the temp project for debugging
      },
    ) => {
      const tmp = await createTestFixture(opts);

      for (const [contractAddress, contractName] of contracts) {
        await cloneContract(tmp, contractAddress, contractName, opts);
      }

      const output = child_process.execSync(
        `pnpm hardhat compile --force ${opts?.debug ? '' : '--quiet'}`,
        {
          encoding: 'utf-8',
          stdio: [
            'inherit',
            opts?.debug ? 'inherit' : 'ignore',
            opts?.debug ? 'inherit' : 'ignore',
          ],
          cwd: tmp,
        },
      );
      if (opts?.debug) console.log('Compilation output:\n', output);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_, contractName] of contracts) {
        expect(
          fs.existsSync(path.join(tmp, 'artifacts', contractName)),
        ).toBeTruthy();
      }

      if (!opts?.debug)
        await fs.promises.rm(tmp, { recursive: true, force: true });
    },
    TIMEOUT,
  );
});
