# @medga/hardhat-clone Usage Tutorial

This tutorial showcases the basic usage of `@medga/hardhat-clone` by clone [WETH](https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2#code) contract from Etherscan into a Hardhat project and build a new `MyToken` contract on top of it.

## Create a Hardhat Project

```shell
mkdir /tmp/hardhat_project
cd /tmp/hardhat_project
npm init
npm i --save-dev hardhat
npx hardhat init
```

These commands create a new folder at `/tmp/hardhat_project` and initialize a Hardhat project in it.

## Install @medga/hardhat-clone Plugin

Install the `@medga/hardhat-clone` package:
```shell
npm i --save-dev @medga/hardhat-clone
```

Load `@medga/hardhat-clone` plugin in Hardhat configuration file `hardhat.config.js` (or equivalent):
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@medga/hardhat-clone");  // <== load `@medga/hardhat-clone` plugin 

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
};
```

## Clone ERC404 Contract

`@medga/hardhat-clone` provides `hardhat clone` command to clone on-chain verified contracts into a folder inside the Hardhat project.

```shell
npx hardhat clone --etherscan-api-key <API_KEY> 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 WETH
```

You may see such output, indicating the successful clone of ERC404 contract: 
```text
Cloning contract at address 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 from Ethereum to WETH
Fetching source code for 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
Fetching https://api.etherscan.io/api?action=getsourcecode&address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&module=contract&apikey=6FTP6N6HH43PTTJ89P9VKKKZWRMV4NH245
Dumping source tree...
Dumping WETH9.sol to /tmp/p1/WETH
Fetching creation information...
Fetching https://api.etherscan.io/api?action=getcontractcreation&contractaddresses=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&module=contract&apikey=6FTP6N6HH43PTTJ89P9VKKKZWRMV4NH245
Constructing CloneMetadata...
Appending to clone metadata file...
Successfully cloned contract to WETH
```

The Etherscan API Key `--etherscan-api-key` can be obtained from Etherscan for free: https://info.etherscan.com/api-keys/.
The last positional argument specifies the folder (relative to the root of current Hardhat project) into which the contract will be cloned.

In this case, we clone ERC404 contract into the `WETH` folder at the root of the project: 
```text
❯ tree -L 1
.
├── contracts
├── WETH
├── hardhat.config.js
├── ignition
├── node_modules
├── package.json
├── package-lock.json
├── README.md
└── test
```

## Compile Cloned Contracts

The key different between `@medga/hardhat-clone` and other similar plugins (e.g., [hardhat-etherscan-contract-cloner](https://www.npmjs.com/package/hardhat-etherscan-contract-cloner)) is that the cloned contracts are fully compilable and can be used by other locally developed contracts as dependencies!

```shell
npx hardhat compile
```

The `hardhat compile` compiles the cloned contract just as other locally developed contracts. 
The compiler settings are preserved just as the verified contract on the blockchain.
The compiler settings of cloned contracts are saved in the `.clone.meta` metadata file of project root.
`@medga/hardhat-clone` instrument into the compilation pipeline of Hardhat, read the clone metadata and compile cloned contracts. 

You can see the compiled contracts in the `artifacts` folder: 
```text
artifacts
├── build-info
│   ├── 22662767f8b1a09e64d324318d70c2ac.json
│   └── 9eb729007ea6644485358ffff367f824.json
├── contracts
│   └── Lock.sol
└── WETH
    └── WETH9.sol
```

## Import Cloned Contracts and Develop New Contracts

The cloned contracts are not isolated. They are just like local contract files and can be imported and used by other contracts. 

Let's create a new Solidity file `MyToken.sol` in `contracts` folder, the source folder of Hardhat project:
```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.4.19;

import { WETH9 } from "WETH/WETH9.sol";

contract MyToken is WETH9 {
	function getMyBalance() public view returns (uint) {
		return balanceOf[msg.sender];
	}
}
```

Note that `WETH9` contract is compiled with Solidity version `0.4.19`, so our `MyToken.sol` file should also use `0.4.19`. 
Remember to declare `0.4.19` compiler in `hardhat.config.js`.
```js
require("@nomicfoundation/hardhat-toolbox");
require("@medga/hardhat-clone");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: {
		compilers: [
			{version: "0.8.24"},
			{version: "0.4.19"}, // compiler for MyToken.sol
		]
	}
};
```
`@medga/hardhat-clone` indeed automatically use `0.4.19` compiler version when compiling `WETH9` contract previously.
However, our `MyToken.sol` is out of the cloned source files, so we need to specify compiler version for `MyToken.sol` here.

`MyToken` contract inherits the cloned `WETH9` contract and define a new function `getMyBalance()` to return the token balance of caller (`msg.sender`).

Additionally, we create a test file `MyToken.js` in `test` folder for `MyToken` contract: 
```javascript
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("MyToken", function () {
  async function deployMyTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("MyToken");
    const contract = await Contract.deploy();

    return { contract, owner };
  }

  it("deposit and get my balance", async function () {
    const { contract, owner } = await loadFixture(deployMyTokenFixture);

    await contract.deposit({ value: 1_000_000 });
    expect(await contract.getMyBalance()).to.gt(0);
  });
});
```

The test file defines a test case, which deploy `MyToken` contract, deposit `1000000 wei` into it and check balance.

Run test:
```shell
npx hardhat test
```

All tests passes:
```text
❯ npx hardhat test
Compiled 2 Solidity files successfully (evm targets: unknown evm version for solc version 0.4.19).

  MyToken
    ✔ deposit and get my balance


  1 passing (48ms)
```

The Hardhat project used in this tutorial can be found in [examples/clone_and_import](./examples/clone_and_import).
Have fun!


##### Want to know how @medga/hardhat-clone makes this possible? 

See our technical design: [./DESIGN.md].

