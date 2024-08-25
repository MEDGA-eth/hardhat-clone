# Design behind @medga/hardhat-clone

@medga/hardhat-clone is built on top of Etherscan, which offers us a ton of verified source code of on-chain smart contracts and their compiler settings. 

## Clone Metadata

Each cloned contract will generate a `CloneMetadats` stored in `.clone.meta` file in the project root.
Clone metadata contains:
- The contract name
- On-chain address
- Compiler version and settings
- The folder into which the contract is cloned
- The main source file that defines the cloned contract.
- A mapping from the original source name (provided by Etherscan) to the actual file path cloned in the folder.

`CloneMetadata` is defined in [meta.ts](src/clone/meta.ts).

The `.clone.meta` file is capable of storing  metadata of multiple cloned contracts, i.e., one can clone multiple contracts from on chain.

## Source Remapping

Some necessary remapping are performed when dumping source files of cloned contracts. 

- If the source name obtained from Etherscan is an absolute path:
  - We remove the leading slash `/` to make it a relative path.
- If the source name include `node_modules`:
  - Hardhat has [special logic](https://github.com/MEDGA-eth/hardhat/blob/e79a633f2ab09c2fcd0bf37c5863d9545ebf5c47/packages/hardhat-core/src/utils/source-names.ts#L59-L90) when resolving source files with `node_modules` in their path, so we replace `node_moduels` with `node-modules` in source file path.

After remapping, we dump the source files into the destination folder, preserving the relative file path structure.

## Instrumentation in Hardhat's Compilation Pipeline

@medga/hardhat-clone extends Hardhat project configuration and overrides several subtasks of Hardhat's Compilation Pipeline to compile cloned contracts. 
The extension of configuration and overrided subtasks can be found in [config-extensions.ts](src/config-extensions.ts).

For each cloned contract, its compiler settings are dynamically added into Hardhat project configuration using `solidity.overrides` field as described in the Hardhat [document](https://hardhat.org/hardhat-runner/docs/advanced/multiple-solidity-versions#multiple-solidity-versions).

The source files of cloned contracts are not in the normal source folder of Hardhat projects (by default `contracts` folder in project root).
@medga/hardhat-clone overrides the `TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS` subtask in compilation pipeline to include source files of cloned contracts.

As mentioned before, some source files are remapped when we dump files from Etherscan.
In addition, some contracts also have [solc remappings](https://docs.soliditylang.org/en/latest/path-resolution.html#import-remapping) defined in their compiler settings.
To apply these remappings, we override `TASK_COMPILE_GET_REMAPPINGS` subtask to instrument these remappings into the dependency resolution of Hardhat compilation pipeline. 
