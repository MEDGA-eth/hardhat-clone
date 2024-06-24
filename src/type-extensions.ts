// This extension is based on the hardhat-etherscan plugin, as it uses the same configuration variable
// ( https://github.com/NomicFoundation/hardhat/blob/master/packages/hardhat-etherscan )
import 'hardhat/types/config';

import { EtherscanConfig } from './source';

declare module 'hardhat/types/config' {
  interface HardhatUserConfig {
    etherscan?: EtherscanConfig;
  }

  interface HardhatConfig {
    etherscan: EtherscanConfig;
  }
}
