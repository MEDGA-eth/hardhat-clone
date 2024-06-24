/* eslint-disable @typescript-eslint/no-unused-vars */
import { EtherscanProvider } from 'ethers';

export * from './types';

export async function getSource(provider: EtherscanProvider, address: string) {
  const resp = await provider.fetch('contract', {
    action: 'getsourcecode',
    address: address,
  });
}

export async function getCreation(
  provider: EtherscanProvider,
  address: string,
) {}
