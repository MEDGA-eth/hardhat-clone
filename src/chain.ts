import { Chain } from 'viem';
import { mainnet } from 'viem/chains';

export const supportedChains: Chain[] = [mainnet];

/**
 * Find a chain by its ID.
 *
 * @param chainId chain ID
 * @returns Chain object
 */
export function findChain(chainId: number): Chain | undefined {
  return supportedChains.find((chain) => chain.id === chainId);
}
