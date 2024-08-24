import { cloneContract, createTestFixture } from './helpers';
import fs from 'node:fs';
import path from 'node:path';
import child_process from 'node:child_process';

const TIMEOUT = 60 * 1000;

describe('hardhat-clone clones verified contracts', () => {
  it.concurrent.each([
    ['0xdAC17F958D2ee523a2206206994597C13D831ec7', 'Tether'],
    ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'USDC Proxy'],
    ['0x43506849D7C04F9138D1A2050bbF3A0c054402dd', 'USDC'],
    ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'WETH'],
    ['0xDb53f47aC61FE54F456A4eb3E09832D08Dd7BEec', 'withlibraries'],
    ['0x8B3D32cf2bb4d0D16656f4c0b04Fa546274f1545', 'withoptimizationdetails'],
    ['0x71356E37e0368Bd10bFDbF41dC052fE5FA24cD05', 'withmetadata'],
    ['0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', 'Uniswap V2: Router 2'],
    [
      '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      'KyberSwap: Meta Aggregation Router v2',
    ],
    ['0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', 'Uniswap Universal Router'],
    ['0x3154Cf16ccdb4C6d922629664174b904d80F2C35', 'Base: Base Bridge'],
  ])(
    `should clone %s (%s)`,
    async (
      contractAddress: string,
      contractName: string,
      opts?: {
        etherscanApiKey?: string;
        debug?: boolean; // whether to print logs and preserve the temp project for debugging
      },
    ) => {
      const tmp = await createTestFixture(opts);
      await cloneContract(tmp, contractAddress, contractName, opts);
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
      expect(fs.existsSync(path.join(tmp, 'artifacts', contractName)));

      if (!opts?.debug)
        await fs.promises.rm(tmp, { recursive: true, force: true });
    },
    TIMEOUT,
  );
});

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
