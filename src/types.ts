import { CLIArgumentType } from 'hardhat/types';
import { types } from 'hardhat/config';
import pathlib from 'node:path';
import { findChain } from './chain';
import { Chain, isAddress } from 'viem';

export const address: CLIArgumentType<string> = {
  parse: (_argName, strValue) => {
    if (strValue.startsWith('0x')) {
      return strValue;
    }
    return `0x${strValue}`;
  },
  name: 'address',
  validate: (_argName: string, value: string): void => {
    if (!isAddress(value)) {
      throw new Error(`Invalid address: ${value}`);
    }
  },
};

export const relativePath: CLIArgumentType<string> = {
  parse: (_argName, strValue) => strValue,
  name: 'relativePath',
  validate: (_argName: string, value: string): void => {
    if (pathlib.isAbsolute(value)) {
      throw new Error(`Path must be relative: ${value}`);
    }
  },
};

export const chain: CLIArgumentType<Chain> = {
  parse: (_argName, strValue) => {
    let chain;
    try {
      const chainId = parseInt(strValue);
      chain = findChain(chainId);
    } catch (e) {
      throw new Error(`Invalid chain ID: ${strValue}`);
    }
    if (chain === undefined) {
      throw new Error(`Unsupported chain: ${strValue}`);
    }
    return chain;
  },
  name: 'chain',
  validate: () => {},
};

export const url: CLIArgumentType<string> = {
  parse: (_argName, strValue) => strValue,
  name: 'url',
  validate: (_argName: string, value: string): void => {
    try {
      new URL(value);
    } catch (e) {
      throw new Error(`Invalid URL: ${e}`);
    }
  },
};

export const string = types.string;
