import { Chain } from 'viem';
import * as chains from 'viem/chains';

export const supportedChains: Chain[] = Object.values(chains);

/**
 * Find a chain by its ID.
 *
 * @param chainId chain ID
 * @returns Chain object
 */
export function findChain(chainId: number): Chain | undefined {
  return supportedChains.find((chain) => chain.id === chainId);
}
