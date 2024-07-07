import { task } from 'hardhat/config';
import * as types from './types';
import { cloneContract } from './clone';

// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import './type-extensions';
import { findChain, supportedChains } from './chain';

task('clone', 'Clone on-chain contract into current Hardhat project')
  .addOptionalParam(
    'chain',
    `The chain ID where the contract is deployed. Supported: ${supportedChains
      .map((chain) => `${chain.id}(${chain.name})`)
      .join(', ')}`,
    1,
    types.chain,
  )
  .addOptionalParam(
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

    await cloneContract(hre, chain, address, destination, {
      apiKey: etherscanApiKey,
      quiet,
    });

    console.log('Successfully cloned contract to', destination);
  });
