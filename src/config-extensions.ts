import fs from 'node:fs';
import { CloneMetadata } from './clone';
import { extendConfig } from 'hardhat/config';
import { HardhatConfig } from 'hardhat/types';
import { plainToInstance } from 'class-transformer';
import assert from 'node:assert';

extendConfig((config: HardhatConfig) => {
  // We apply our default config here. Any other kind of config resolution
  // or normalization should be placed here.
  //
  // `config` is the resolved config, which will be used during runtime and
  // you should modify.
  // `userConfig` is the config as provided by the user. You should not modify
  // it.
  //
  // If you extended the `HardhatConfig` type, you need to make sure that
  // executing this function ensures that the `config` object is in a valid
  // state for its type, including its extensions. For example, you may
  // need to apply a default value, like in this example.

  if (!fs.existsSync(config.paths.root + CloneMetadata)) {
    // if there is no metadata file, there is no cloned contract, so we don't need to do anything
    return;
  }

  // We need to load the metadata file
  const metadataRaw = JSON.parse(
    fs.readFileSync(config.paths.root + CloneMetadata, 'utf8'),
  );
  assert.ok(
    metadataRaw instanceof Array,
    'Invalid metadata file, expected an array of CloneMetadata',
  );
  const cloneMetas: CloneMetadata[] = metadataRaw.map((meta: unknown) =>
    plainToInstance(CloneMetadata, meta),
  );

  // We need to override SolcConfig for the cloned contracts.
  for (const cloneMeta of cloneMetas) {
    config.solidity.overrides[cloneMeta.path] = cloneMeta.solcConfig;
  }
});
