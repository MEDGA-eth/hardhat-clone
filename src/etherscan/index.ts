/* eslint-disable @typescript-eslint/no-unused-vars */
import { Address, Chain } from 'viem';
import { Creation, Metadata } from './types';
import { plainToInstance } from 'class-transformer';
import { CloneError, EtherscanError, NotVerifiedError } from '../error';

export * from './types';

/**
 * Interfaces for extended Hardhat configuration
 * We only need an API Key
 */
export interface EtherscanConfig {
  // API key or API keys for each specific network
  apiKey?: string | Record<string, string>;
}

async function callEtherscanApi(
  chain: Chain,
  apiKey: string | undefined,
  module: string,
  params: Record<string, string>,
) {
  params['module'] = module;
  if (apiKey) params['apikey'] = apiKey;
  const req = new Request(
    `${chain.blockExplorers?.default.apiUrl as string}?${new URLSearchParams(
      params,
    )}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  console.debug('Fetching', req.url);
  const resp = await fetch(req);
  return await resp.json();
}

/**
 * Fetch the source code of a contract from Etherscan.
 */
export async function getSource(
  chain: Chain,
  address: Address,
  apiKey?: string,
): Promise<Metadata> {
  const resp = await callEtherscanApi(chain, apiKey, 'contract', {
    action: 'getsourcecode',
    address: address,
  });
  if (resp.status !== '1') {
    console.log(resp);
    throw new EtherscanError('failed to get source', resp.message);
  }

  if (resp.result[0]['ABI'] === 'Contract source code not verified') {
    throw new NotVerifiedError(address);
  }
  const meta = plainToInstance(Metadata, resp.result[0]);
  if (!meta.isVerified) {
    throw new NotVerifiedError(address);
  }

  return meta;
}

export async function getCreation(
  chain: Chain,
  address: Address,
  apiKey?: string,
) {
  const resp = await callEtherscanApi(chain, apiKey, 'contract', {
    action: 'getcontractcreation',
    contractaddresses: address,
  });
  if (resp.status !== '1') {
    throw new EtherscanError(
      'failed to get contract creation info',
      resp.message,
    );
  }

  return plainToInstance(Creation, resp.result[0]);
}
