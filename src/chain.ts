import { Network } from 'ethers';

export const supportedNetworks: Network[] = [Network.from('mainnet')];

export function findNetwork(chainId: number): Network;
export function findNetwork(name: string): Network;
export function findNetwork(
  chainIdOrName: number | string,
): Network | undefined {
  if (typeof chainIdOrName === 'number') {
    return supportedNetworks.find(
      (chain) => chain.chainId === BigInt(chainIdOrName),
    );
  } else {
    return supportedNetworks.find((chain) => chain.name === chainIdOrName);
  }
}
