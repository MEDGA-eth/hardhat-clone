import { URL } from 'url';

export class ChainDeclaration {
  constructor(
    public chainId: number,
    public name: string,
    public etherscanUrl: URL,
  ) {}

  public toString(): string {
    return `${this.chainId}:${this.name}`;
  }
}

export const MAINNET = new ChainDeclaration(
  1,
  'mainnet',
  new URL('https://etherscan.io'),
);

export const chains: ChainDeclaration[] = [MAINNET];

export function getChainDeclaration(chainId: number): ChainDeclaration;
export function getChainDeclaration(name: string): ChainDeclaration;
export function getChainDeclaration(
  chainIdOrName: number | string,
): ChainDeclaration | undefined {
  if (typeof chainIdOrName === 'number') {
    return chains.find((chain) => chain.chainId === chainIdOrName);
  } else {
    return chains.find((chain) => chain.name === chainIdOrName);
  }
}

export function getSupportedChainListString(): string {
  return chains.map((chain) => chain.toString()).join(', ');
}
