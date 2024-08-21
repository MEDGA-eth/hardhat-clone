import fs from 'node:fs';
import { CloneMetadata } from './clone';
import { extendConfig, subtask, types } from 'hardhat/config';
import { HardhatConfig } from 'hardhat/types';
import { plainToInstance } from 'class-transformer';
import assert from 'node:assert';
import path from 'node:path';
import {
  TASK_COMPILE_GET_REMAPPINGS,
  TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
} from 'hardhat/builtin-tasks/task-names';
import { getAllFilesMatching } from 'hardhat/internal/util/fs-utils';

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
  // need to apply a default value.

  console.log('Hardhat-clone is extending config');

  const cloneMetas = loadCloneMetaSet(config);

  // We need to override SolcConfig for the cloned contracts.
  for (const cloneMeta of cloneMetas) {
    config.solidity.overrides[
      path.join(
        path.relative(config.paths.root, config.paths.sources),
        cloneMeta.main_file,
      )
    ] = cloneMeta.solcConfig;
  }
});

function loadCloneMetaSet(config: HardhatConfig): CloneMetadata[] {
  if (!fs.existsSync(path.join(config.paths.root, CloneMetadata.META_FILE))) {
    // if there is no metadata file, there is no cloned contract, so we don't need to do anything
    return [];
  }

  // We need to load the metadata file
  const metadataRaw = JSON.parse(
    fs.readFileSync(
      path.join(config.paths.root, CloneMetadata.META_FILE),
      'utf8',
    ),
  );
  assert.ok(
    metadataRaw instanceof Array,
    'Invalid metadata file, expected an array of CloneMetadata',
  );
  const cloneMetas: CloneMetadata[] = metadataRaw.map((meta: unknown) =>
    plainToInstance(CloneMetadata, meta),
  );
  return cloneMetas;
}

subtask(TASK_COMPILE_GET_REMAPPINGS).setAction(
  async (_, { config }): Promise<Record<string, string>> => {
    console.log('Hardhat-clone is extending overriding remapping subtask');
    const remappings: Record<string, string> = {};

    const cloneMetas = loadCloneMetaSet(config);
    for (const meta of cloneMetas) {
      for (const clonedFile of meta.clonedFiles) {
        remappings[clonedFile] = path.join(meta.folder, clonedFile);
      }
    }

    return remappings;
  },
);

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS)
  .addOptionalParam('sp', undefined, undefined, types.string)
  .setAction(
    async ({ sp }: { sp?: string }, { config }): Promise<string[]> => {
      const cloneMetas = loadCloneMetaSet(config);
      const clonedFiles = cloneMetas.flatMap((meta) =>
        path.join(config.paths.root, meta.folder, meta.main_file),
      );

      const sourceFiles = await getAllFilesMatching(
        sp ?? config.paths.sources,
        (f) => f.endsWith('.sol'),
      );
      return [...sourceFiles, ...clonedFiles];
    },
  );
