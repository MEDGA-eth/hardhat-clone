require("@nomicfoundation/hardhat-toolbox");
require("@medga/hardhat-clone");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: {
		compilers: [
			{version: "0.8.24"},
			{version: "0.4.19"},
		]
	},
	networks: {
		hardhat: {
			fork: {
				url: "https://eth.llamarpc.com",
			}
		}
	}
};
