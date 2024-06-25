import path from 'node:path';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { EtherscanConfig } from './etherscan';
import { getSource as getSourceMetadata } from './etherscan';
import { Address, Chain } from 'viem';
/**
 * Clone a contract from a chain into the current project.
 *
 * @param hre The Hardhat runtime environment.
 * @param chain The chain to clone the contract from.
 * @param address The address of the contract to clone.
 * @param destination The path (relative to `contracts` folder of this project) where the contract should be cloned.
 * @param opts Some other options.
 */
export async function cloneContract(
  hre: HardhatRuntimeEnvironment,
  chain: Chain,
  address: Address,
  destination: string,
  opts: {
    apiKey?: string;
    quiet?: boolean;
  },
) {
  // Convert destination to absolute path
  destination = path.join(hre.config.paths.sources, destination);

  // Log the cloning operation
  opts.quiet ||
    console.info(
      'Cloning contract at address',
      address,
      'from',
      chain.name,
      'to',
      destination,
    );

  let apiKey = opts.apiKey;
  // try to load API key from the configuration if not provided in CLI
  if (!apiKey) {
    const etherscanConfig = hre.config.etherscan as EtherscanConfig;
    if (typeof etherscanConfig.apiKey === 'string') {
      apiKey = etherscanConfig.apiKey;
    } else {
      apiKey = etherscanConfig.apiKey?.[chain.name];
    }
  }

  // check API KEY
  !apiKey && console.debug('No API key provided');

  // fetch source from Etherscan
  console.debug('Fetching source code for', address);
  const source_meta = await getSourceMetadata(chain, address, apiKey);

  // dump source code
  console.debug('Dumping source code to', destination);
  const source_tree = source_meta.sourceTree;
  console.log(source_tree);
  source_tree.dump(destination);
  // TODO: deal with remappings
}
