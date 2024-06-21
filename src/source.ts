import { Network } from "ethers";

// Interfaces for extended Hardhat configuration
// We only need an API Key
export interface EtherscanConfig {
  // API key or API keys for each specific network
  apiKey?: string | Record<string, string>;
}
