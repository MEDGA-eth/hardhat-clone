import path from 'node:path';
import fs from 'node:fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { EtherscanConfig, getCreation } from './etherscan';
import { getSource as getSourceMetadata } from './etherscan';
import { Address, Chain } from 'viem';
import { CloneMetadata } from './config';
import { instanceToPlain } from 'class-transformer';

/**
 * Clone a contract from a chain into the current project.
 *
 * @param hre The Hardhat runtime environment.
 * @param chain The chain to clone the contract from.
 * @param address The address of the contract to clone.
 * @param destination The path (relative to source folder of this project) where the contract should be cloned.
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

  // dump source tree
  console.debug('Dumping source tree...');
  source_meta.sourceTree.dump(path.join(hre.config.paths.sources, destination));

  if (!apiKey) {
    console.log("Wait for 5 second before next request to Etherscan to avoid rate limiting");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // fetch creation information of the contract
  console.debug('Fetching creation information...');
  const creation = await getCreation(chain, address, apiKey);

  // construct CloneMetadata
  console.debug('Constructing CloneMetadata...');
  const cloneMetadata = new CloneMetadata();
  cloneMetadata.address = address;
  cloneMetadata.path = path.join(destination, source_meta.mainFile);
  cloneMetadata.chainId = chain.id;
  cloneMetadata.creationTransaction = creation.txHash;
  cloneMetadata.deployer = creation.contractCreator;
  cloneMetadata.constructorArguments = source_meta.constructorArguments;
  cloneMetadata.solcConfig = source_meta.solcConfig;
  fs.writeFileSync(
    path.join(hre.config.paths.root, '.clone.meta.json'),
    JSON.stringify(instanceToPlain(cloneMetadata), null, 2),
  );
}
