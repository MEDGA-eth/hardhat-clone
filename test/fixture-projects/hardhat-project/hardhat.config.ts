// We load the plugin here.
import { HardhatUserConfig } from 'hardhat/types';
import '@medga/hardhat-clone';

const config: HardhatUserConfig = {
  solidity: '0.7.3',
  defaultNetwork: 'hardhat',
};

export default config;
