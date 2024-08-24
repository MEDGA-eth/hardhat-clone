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

  const cloneMetas = loadCloneMetaSet(config);

  // We need to override SolcConfig for the cloned contracts.
  for (const cloneMeta of cloneMetas) {
    for (const clonedFile of Object.values(cloneMeta.clonedFiles)) {
      const remappings = getRemappings(cloneMeta);
      const solcConfig = cloneMeta.solcConfig;
      // delete remappings since hardhat currently does not support solc remappings
      // the remappings should have been process in the import resolution phase.
      delete solcConfig.settings.remappings;
      // we force the solc config for every cloned files (both their original source names and remapped source names).
      config.solidity.overrides[
        path.join(cloneMeta.folder, clonedFile)
      ] = solcConfig;
      for (const from of Object.keys(remappings)) {
        if (from.endsWith('.sol')) {
          config.solidity.overrides[from] = solcConfig;
        }
      }
    }
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
  return metadataRaw.map((meta: unknown) =>
    plainToInstance(CloneMetadata, meta),
  );
}

/**
 * Get remappings of a cloned contract.
 * All the remappings returned are guaranteed to be file-to-file remappings.
 */
function getRemappings(meta: CloneMetadata): Record<string, string> {
  const remappings: Record<string, string> = {};

  // original remappings of the cloned contract
  for (const remapping of meta.solcConfig.settings.remappings ?? []) {
    const [from, to] = (remapping as string).split('=');
    if (from === to) {
      continue;
    }
    for (const actualPath of Object.values(meta.clonedFiles)) {
      if (actualPath.startsWith(to)) {
        const suffix = actualPath.substring(to.length);
        remappings[from + suffix] = path.join(meta.folder, actualPath);
      }
    }
  }

  for (const [sourceName, actualPath] of Object.entries(meta.clonedFiles)) {
    remappings[sourceName] = path.join(meta.folder, actualPath);
  }

  return remappings;
}

/**
 * This task returns a Record<string, string> representing remappings to be used
 * by the resolver.
 */
subtask(TASK_COMPILE_GET_REMAPPINGS).setAction(
  async (_, { config }): Promise<Record<string, string>> => {
    const remappings = {};
    const cloneMetas = loadCloneMetaSet(config);
    for (const meta of cloneMetas) {
      Object.assign(remappings, getRemappings(meta));
    }
    return remappings;
  },
);

/**
 * Returns a list of absolute paths to all the solidity files in the project.
 * This list doesn't include dependencies, for example solidity files inside
 * node_modules.
 *
 * This is the right task to override to change how the solidity files of the
 * project are obtained.
 */
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
