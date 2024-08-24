// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import './type-extensions';
// This import is needed to extend Hardhat config with compiler settings of cloned contracts.
import './config-extensions';

import { task } from 'hardhat/config';
import * as types from './types';
import { cloneContract } from './clone';
import { findChain } from './chain';
import { CloneError } from './error';

task('clone', 'Clone on-chain contract into current Hardhat project')
  .addOptionalParam(
    'chain',
    `The chain ID where the contract is deployed. This option is used to determine Etherscan API endpoint. List of supported chains: https://github.com/wevm/viem/blob/main/src/chains/index.ts`,
    1,
    types.chain,
  )
  .addParam(
    'etherscanApiKey',
    'The Etherscan API key (or equivalent) to use to fetch the contract',
  )
  .addFlag('quiet', 'Do not log anything')
  .addPositionalParam(
    'address',
    'The address of the contract to clone',
    undefined,
    types.address,
    false,
  )
  .addOptionalPositionalParam(
    'destination',
    'The path (relative to `contracts` folder of this project) where the contract should be cloned',
    '.',
    types.relativePath,
  )
  .setAction(async (args, hre) => {
    // eslint-disable-next-line prefer-const
    let { address, destination, chain, etherscanApiKey, quiet } = args;
    if (!(chain instanceof Object)) chain = findChain(chain);

    try {
      await cloneContract(hre, chain, address, destination, {
        apiKey: etherscanApiKey,
        quiet,
      });
      quiet || console.log('Successfully cloned contract to', destination);
    } catch (e) {
      const err = e as CloneError;
      quiet ||
        console.error(
          `Failed to clone contract due to error: ${
            err.name
          }\n${err.toString()}`,
        );
      process.exit(1);
    }
  });
