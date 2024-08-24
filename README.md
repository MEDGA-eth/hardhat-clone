# hardhat-clone: Clone on-chain contracts into your hardhat project

`hardhat-clone` is a plugin of [Hardhat](https://hardhat.org/) smart contract development toolchain.
`hardhat-clone` takes the address of a verified contract deployed on the blockchain (any EVM-compatible blockchain, e.g., Ethereum, Binanace Smart Chain, Optimism, etc.) and clone the contract source into the current Hardhat project. 
The cloned contracts are reorganized such that it can be compiled together with other 
contracts in the Hardhat project.

This project is a migrated implementation of `forge clone` feature of [foundry](https://book.getfoundry.sh/reference/forge/forge-clone) in Hardhat, maintained by [MEDGA](https://medga.org) Team.

## Usage

Install `hardhat-clone` plugin:
```shell
npm i @medga/hardhat-clone
```

Import `hardhat-clone` plugin in your Hardhat config file (e.g., `hardhat.config.ts`):
```typescript
import '@medga/hardhat-clone'
```

Clone an on-chain verified contract from Etherscan: 
```shell
npx hardhat clone --etherscan-api-key <API_KEY> <ADDRESS> <FOLDER>
```

This command clones the specified contract from Ethereum Mainnet (source provided by Etherscan API) into `<FOLDER>`, which is a folder path relative to the root of Hardhat project. 

Cloning from other EVM-compatible is also possible by specifying the chain ID with `--chain`.

