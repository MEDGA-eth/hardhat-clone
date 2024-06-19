import path from 'path';
import { ChainDeclaration } from './chain';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
/**
 * Clone a contract from a chain into the current project.
 *
 * @param hre The Hardhat runtime environment
 * @param chain The chain to clone the contract from
 * @param address The address of the contract to clone
 * @param destination The path (relative to `contracts` folder of this project) where the contract should be cloned
 * @param opts Some other options
 */
export function cloneContract(
  hre: HardhatRuntimeEnvironment,
  chain: ChainDeclaration,
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
}
