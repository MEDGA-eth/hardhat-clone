export * from './meta';

import path from 'node:path';
import fs from 'node:fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { EtherscanConfig, getCreation } from '../etherscan';
import { getSource as getSourceMetadata } from '../etherscan';
import { Address, Chain } from 'viem';
import { CloneMetadata } from './meta';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import assert from 'node:assert';
import { FileCollisionError, UnsupportedError } from '../error';

/**
 * Clone a contract from a chain into the current project.
 *
 * @param hre The Hardhat runtime environment.
 * @param chain The chain to clone the contract from.
 * @param address The address of the contract to clone.
 * @param destination The path (relative to root folder of this project) where the contract should be cloned.
 * @param opts Some other options.
 */
export async function cloneContract(
  hre: HardhatRuntimeEnvironment,
  chain: Chain,
  address: Address,
  destination: string,
  opts: {
    apiKey?: string; // Etherscan API key
    quiet?: boolean; // Do not log anything
  },
) {
  // load clone metadata file
  const metaFile = path.join(hre.config.paths.root, CloneMetadata.META_FILE);
  let metas: CloneMetadata[] = [];
  if (fs.existsSync(metaFile)) {
    const metaRaw = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
    assert.ok(
      metaRaw instanceof Array,
      'Invalid metadata file, expected an array of CloneMetadata',
    );
    metas = metaRaw.map((meta: unknown) =>
      plainToInstance(CloneMetadata, meta),
    );
  }

  if (destination === hre.config.paths.sources) {
    throw new UnsupportedError(
      'Cannot clone contracts into Hardhat source folder',
    );
  }

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
  !apiKey && !opts.quiet && console.debug('No API key provided');

  // fetch source from Etherscan
  opts.quiet || console.debug('Fetching source code for', address);
  const source_meta = await getSourceMetadata(chain, address, apiKey);

  // dump source tree
  opts.quiet || console.debug('Dumping source tree...');
  const dumpDir = path.join(hre.config.paths.root, destination);
  const overrides = source_meta.sourceTree.check_dump_override(dumpDir);
  if (overrides.length > 0) {
    if (!opts.quiet) {
      console.error(
        `Existing contracts will be overridden. The overridden files in ${hre.config.paths.root} are:`,
      );
      for (const file of overrides) {
        console.error(`\t${path.relative(hre.config.paths.root, file)}`);
      }
    }
    throw new FileCollisionError(overrides);
  }
  source_meta.sourceTree.dump(dumpDir);

  if (!apiKey) {
    opts.quiet ||
      console.log(
        'Wait for 5 second before next request to Etherscan to avoid rate limiting',
      );
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // fetch creation information of the contract
  opts.quiet || console.debug('Fetching creation information...');
  const creation = await getCreation(chain, address, apiKey);

  // construct CloneMetadata
  opts.quiet || console.debug('Constructing CloneMetadata...');
  const cloneMetadata = new CloneMetadata();
  cloneMetadata.address = address;
  cloneMetadata.folder = destination;
  cloneMetadata.main_file = source_meta.mainFile;
  cloneMetadata.chainId = chain.id;
  cloneMetadata.creationTransaction = creation.txHash;
  cloneMetadata.deployer = creation.contractCreator;
  cloneMetadata.constructorArguments = source_meta.constructorArguments;
  cloneMetadata.solcConfig = source_meta.solcConfig;
  // Source tree dumping renames "node_modules" to "node-modules", so we need to regulate the original remappings as well
  cloneMetadata.solcConfig.settings.remappings = [];
  for (const remap of source_meta.solcConfig.settings.remappings ?? []) {
    // eslint-disable-next-line prefer-const
    let [from, to] = (remap as string).split('=');
    // apply the remappings generated during dumping source map
    for (const [from_prefix, to_prefix] of Object.entries(
      source_meta.sourceTree.remappings,
    )) {
      if (to.startsWith(from_prefix)) {
        to = to.replace(from_prefix, to_prefix);
        break;
      }
    }
    cloneMetadata.solcConfig.settings.remappings.push(`${from}=${to}`);
  }
  cloneMetadata.clonedFiles = source_meta.sourceTree.allFiles;
  // append to the metadata file
  opts.quiet || console.debug('Appending to clone metadata file...');
  metas.push(cloneMetadata);
  fs.writeFileSync(
    path.join(hre.config.paths.root, CloneMetadata.META_FILE),
    JSON.stringify(
      metas.map((meta) => instanceToPlain(meta)),
      null,
      2,
    ),
  );
}
