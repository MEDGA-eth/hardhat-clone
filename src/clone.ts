import path from 'path';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { EtherscanProvider, Network } from 'ethers';
import { EtherscanConfig } from './source';
import { getSource } from './etherscan';
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
  chain: Network,
  address: string,
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
      chain.toString(),
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

  // create EtherscanProvider
  console.debug('Creating EtherscanProvider for', chain.toString());
  !apiKey && console.debug('No API key provided');
  const provider = new EtherscanProvider(chain, apiKey);

  // fetch source from Etherscan
  console.debug('Fetching source code for', address);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const source = await getSource(provider, address);
}
