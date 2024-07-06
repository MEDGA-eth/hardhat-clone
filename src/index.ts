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

// extendConfig(
//   (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
//     // We apply our default config here. Any other kind of config resolution
//     // or normalization should be placed here.
//     //
//     // `config` is the resolved config, which will be used during runtime and
//     // you should modify.
//     // `userConfig` is the config as provided by the user. You should not modify
//     // it.
//     //
//     // If you extended the `HardhatConfig` type, you need to make sure that
//     // executing this function ensures that the `config` object is in a valid
//     // state for its type, including its extensions. For example, you may
//     // need to apply a default value, like in this example.
//     const userPath = userConfig.paths?.newPath;

//     let newPath: string;
//     if (userPath === undefined) {
//       newPath = path.join(config.paths.root, 'newPath');
//     } else {
//       if (path.isAbsolute(userPath)) {
//         newPath = userPath;
//       } else {
//         // We resolve relative paths starting from the project's root.
//         // Please keep this convention to avoid confusion.
//         newPath = path.normalize(path.join(config.paths.root, userPath));
//       }
//     }

//     config.paths.newPath = newPath;
//   },
// );
